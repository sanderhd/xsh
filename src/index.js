#!/usr/bin/env node

import chalk from "chalk";
import readline from "node:readline"
import { exec } from "node:child_process"
import os from "node:os"
import process, { env, stderr, stdout } from "node:process";
import fs from "fs";
import path from "path"
import { fileURLToPath, pathToFileURL } from "url";

import icons from "./config/icons.json" with { type: "json" };
import { getTheme, getThemeName, setTheme, listThemes } from "./functions/themeManager.js";
import autocomplete from "./functions/autoCompletion.js";
import { getConfigValue } from "./functions/configManager.js";
import { get } from "node:http";

let lastExitCode = 0;
let lastDuration = null;
const customCommands = new Map();

function bg(hex) { return chalk.bgHex(hex); }
function fg(hex) { return chalk.hex(hex); }

function segment(text, { fgColor = "#000000", bgColor = "#ffffff"} = {}) {
    return bg(bgColor)(fg(fgColor)(` ${text} `));
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadCommands() {
    const commandsDir = path.join(__dirname, "commands");
    if (!fs.existsSync(commandsDir)) return;

    const files = fs.readdirSync(commandsDir).filter(f => f.endsWith(".js"));
    for (const file of files) {
        try {
            const fullPath = path.join(commandsDir, file);
            const fileUrl = pathToFileURL(fullPath).href;
            const command = await import(fileUrl);
            const name = command.default.name || path.basename(file, ".js");
            const run = command.default.run;

            if (typeof run === "function") {
                customCommands.set(name, { run });
                (command.default.aliases || []).forEach(alias => customCommands.set(alias, { run }));
            }
        } catch (err) {
            console.error(`Error loading command ${file}:`, err);
        }
    }
}

function joinSegments(segments) {
    let out = "";
    for (let i = 0; i < segments.length; i++) {
        const cur = segments[i];
        out += cur.render;

        const next = segments[i + 1];
        if (next) {
            out += chalk.hex(cur.bgColor).bgHex(next.bgColor)(icons.sep);
        } else {
            out += chalk.hex(cur.bgColor)(icons.sep) + chalk.reset("");
        }
    }
    return out;
}

function getCwdLabel() {
    const cwd = process.cwd();
    const home = os.homedir();
    if (cwd === home) return "~";
    if (cwd.startsWith(home)) return "~" + cwd.slice(home.length);
    return cwd;
}

function getGitBranch() {
    return new Promise((resolve) => {
        exec("git rev-parse --abbrev-ref HEAD", { cwd: process.cwd() }, (err, stdout) => {
            if (err) return resolve(null);
            const branch = stdout.trim();
            resolve(branch || null);
        });
    });
}

async function detectEnviroment() {
    if (process.env.VIRTUAL_ENV) {
        const venvName = path.basename(process.env.VIRTUAL_ENV);
        return { type: 'venv', value: `🐍 ${venvName}`}
    }

    if (fs.existsSync(path.join(process.cwd(), 'Dockerfile')) || fs.existsSync(path.join(process.cwd(), 'docker-compose-yml'))) {
        return { type: 'docker', value: '🐳 Docker'}
    }

    const pkgPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(pkgPath)) {
        const nodeVersion = process.version;
        return { type: 'node', value: `📦 ${nodeVersion}` };
    }
}

async function renderPrompt() {
    const theme = getTheme();
    const cwd = getCwdLabel();
    const showGitBranch = getConfigValue("prompt.showGitBranch") ?? true;
    const branch = showGitBranch ? await getGitBranch() : null;
    await loadCommands();

    const showExitCode = getConfigValue("prompt.showExitCode") ?? true;
    const showTime = getConfigValue("prompt.showTime") ?? true;
    const showDuration = getConfigValue("prompt.showDuration") ?? true;
    const promptSymbol = getConfigValue("prompt.symbol") || "❯";

    const status = lastExitCode === 0
        ? `${icons.ok} 0`
        : `${icons.fail} ${lastExitCode}`;

    const now = new Date();
    const timeStr = now.toLocaleDateString("nl-NL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    const segs = [];

    if (showExitCode) {
        segs.push({
            bgColor: lastExitCode === 0 ? theme.accentColor : theme.warningColor,
            render: segment(status, { fgColor: theme.primaryColor, bgColor: lastExitCode === 0 ? theme.accentColor : theme.warningColor }),
        });
    }

    segs.push({
        bgColor: theme.backgroundColor,
        render: segment(`${icons.folder}  ${cwd}`, { fgColor: theme.primaryColor, bgColor: theme.backgroundColor }),
    })

    if (branch) {
        segs.push({
            bgColor: theme.successColor,
            render: segment(`${icons.branch} ${branch}`, { fgColor: theme.backgroundColor, bgColor: theme.successColor }),
        });
    }

    const line1 = joinSegments(segs);

    const rightParts = [];
    const envInfo = await detectEnviroment();

    if (envInfo) {
        rightParts.push(envInfo.value);
    } else if (lastDuration === null && showTime) {
        rightParts.push(`⏱ ${timeStr}`);
    } else if (lastDuration !== null && showDuration) {
        const totalSecs = Math.floor(lastDuration / 1000);
        const ms = lastDuration % 1000;
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        
        let durStr;
        if (mins > 0) {
            durStr = `${mins}m ${secs}s`;
        } else if (totalSecs > 0) {
            durStr = `${secs}s`;
        } else {
            durStr = `${ms}ms`
        }
        rightParts.push(`⏱ ${durStr}`)
    }

    const rightText = rightParts.join(" ");
    const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");
    const leftLen = stripAnsi(line1).length;
    const rightLen = rightText.length > 0 ? rightText.length + 2 : 0;
    const termWidth = process.stdout.columns || 80;
    const padding = termWidth - leftLen - rightLen;

    let rightSegment = "";
    if (rightText.length > 0) {
        rightSegment = chalk.hex(theme.primaryColor)(
            " ".repeat(Math.max(0, padding)) +
            chalk.hex(theme.backgroundColor)(icons.sepLeft) +
            ` ${rightText} `
        );
    }

    const line2 = chalk.hex(theme.accentColor)(`${promptSymbol} `);

    return `${line1}${rightSegment}\n${line2}`
}

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

let buffer = "";
let cursorPos = 0;
let firstDraw = true;
let history = [];
let historyIndex = -1;
let liveSuggestion = "";

const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");

function redraw(promptStr) {
    const visiblePromptLen = stripAnsi(promptStr).length;
    const desiredCursorCol = visiblePromptLen + cursorPos;
    const suggestionStyled = liveSuggestion ? chalk.hex("#6e767d")(liveSuggestion) : "";
    const fullLine = promptStr + buffer + suggestionStyled;

    if (firstDraw) {
        firstDraw = false;
        process.stdout.write(fullLine);
        const endCol = visiblePromptLen + buffer.length + stripAnsi(liveSuggestion).length;
        const leftMoves = endCol - desiredCursorCol;
        if (leftMoves > 0) process.stdout.write(`\x1b[${leftMoves}D`);
    } else {
        process.stdout.write("\x1b[2K\x1b[G");
        process.stdout.write("\x1b[1A\x1b[2K\x1b[G");
        process.stdout.write(fullLine);
        const endCol = visiblePromptLen + buffer.length + stripAnsi(liveSuggestion).length;
        const leftMoves = endCol - desiredCursorCol;
        if (leftMoves > 0) process.stdout.write(`\x1b[${leftMoves}D`);
    }
}

async function runCommand(cmd) {
    return new Promise((resolve) => {
        exec(cmd, { shell: "cmd.exe", cwd: process.cwd() }, (err, stdout, stderr) => {
            if (stdout) process.stdout.write(stdout);
            if (stderr) process.stderr.write(stderr);
            if (err) return resolve(err.code ?? 1);
            resolve(0);
        });
    });
}

async function loop() {
    while (true) {
        buffer = "";
        firstDraw = true;
        liveSuggestion = "";
        const promptStr = await renderPrompt();
        redraw(promptStr);

        const exitCode = await new Promise((resolve) => {
            function onKey(str, key) {
                if (key?.ctrl && key.name === "c") {
                    process.stdin.removeListener("keypress", onKey);
                    process.exit(0);
                }

                if (!(key?.name === "tab" || key?.sequence === "\t")) {
                    liveSuggestion = "";
                }

                if (key?.name === "tab" || key?.sequence === "\t") {
                    try {
                        const { candidates, replaceStart, replaceEnd } = autocomplete.complete(buffer, cursorPos, customCommands);
                        if (!candidates || candidates.length === 0 ) return;

                        if (candidates.length === 1) {
                            const completion = candidates[0];
                            buffer = buffer.slice(0, replaceStart) + completion + buffer.slice(replaceEnd);
                            cursorPos = replaceStart + completion.length;
                            redraw(promptStr);
                            return
                        }

                        let common = candidates[0];
                        for (const c of candidates) {
                            let i = 0;
                            while (i < common.length && i < c.length && common[i] === c[i]) i++;
                            common = common.slice(0, i);
                        }

                        const typedLen = cursorPos - replaceStart;
                        if (common.length > typedLen) {
                            buffer = buffer.slice(0, replaceStart) + common + buffer.slice(replaceEnd);
                            cursorPos = replaceStart + common.length;
                            redraw(promptStr);
                            return;
                        }

                        const firstRem = candidates[0].slice(typedLen) || "";
                        liveSuggestion = firstRem;
                        process.stdout.write("\n" + candidates.join("    ") + "\n");
                        firstDraw = true;
                        redraw(promptStr);
                    } catch (e) {

                    }
                    return;
                 }

                if (key?.name === "return") {
                    process.stdin.removeListener("keypress", onKey);
                    process.stdout.write("\n");
                    resolve(0);
                    return;
                }

                if (key?.name === "backspace") {
                    if (cursorPos > 0) {
                        buffer = buffer.slice(0, cursorPos - 1) + buffer.slice(cursorPos);
                        cursorPos--;
                        redraw(promptStr);
                    }
                    return;
                }

                if (key?.name === "delete") {
                    if (cursorPos < buffer.length) {
                        buffer = buffer.slice(0, cursorPos) + buffer.slice(cursorPos + 1);
                        redraw(promptStr);
                    }
                    return;
                }

                if (key?.name === "left") {
                    if (cursorPos > 0) {
                        cursorPos--;
                        redraw(promptStr);
                    }
                    return;
                }
                if (key?.name === "right") {
                    if (cursorPos < buffer.length) {
                        cursorPos++;
                        redraw(promptStr);
                    }
                    return;
                }

                if (key?.name === "home") {
                    cursorPos = 0;
                    redraw(promptStr);
                    return;
                }
                if (key?.name === "end") {
                    cursorPos = buffer.length;
                    redraw(promptStr);
                    return;
                }

                if (key?.name === "up") {
                    if (history.length === 0) return;
                    if (historyIndex === -1) historyIndex = history.length;
                    historyIndex = Math.max(0, historyIndex - 1);
                    buffer = history[historyIndex] || "";
                    cursorPos = buffer.length;
                    redraw(promptStr);
                    return;
                }
                if (key?.name === "down") {
                    if (history.length === 0) return;
                    if (historyIndex === -1) return;
                    historyIndex = Math.min(history.length, historyIndex + 1);
                    buffer = historyIndex === history.length ? "" : (history[historyIndex] || "");
                    cursorPos = buffer.length;
                    redraw(promptStr);
                    return;
                }

                if (key?.sequence && key.sequence.length > 0 && !key.ctrl && !key.meta) {
                    buffer = buffer.slice(0, cursorPos) + key.sequence + buffer.slice(cursorPos);
                    cursorPos += key.sequence.length;
                    redraw(promptStr);
                    return;
                }
            }

            process.stdin.on("keypress", onKey);
        });

        const cmd = buffer.trim();

        if (!cmd) {
            lastExitCode = 0;
            historyIndex = -1;
            buffer = "";
            cursorPos = 0;
            continue;
        }

        if (history[history.length - 1] !== cmd) history.push(cmd);
        historyIndex = -1;
        buffer = "";
        cursorPos = 0;

        const [cmdName, ...args] = cmd.split(/\s+/);
        if (customCommands.has(cmdName)) {
            const handler = customCommands.get(cmdName).run;
            const start = Date.now();
            try {
                const result = await handler({
                    args,
                    cwd: process.cwd(),
                    print: (s) => process.stdout.write(s + "\n"),
                    runCommand,
                    reload: loadCommands,
                });
                if (result && typeof result.code === "number") lastExitCode = result.code;
                else lastExitCode = 0;
            } catch (e) {
                lastExitCode = 1;
                console.error(e);
            }
            lastDuration = Date.now() - start;
            continue
        }

        if (cmd.startsWith("cd ")) {
            const target = cmd.slice(3).trim().replace(/^"(.*)"$/, "$1");
            const next = path.isAbsolute(target) ? target : path.join(process.cwd(), target);

            try {
                process.chdir(next);
                lastExitCode = 0;
            } catch {
                console.error(chalk.hex(getTheme().errorColor)(`cd: no such dir ${next}`));
                lastExitCode = 1;
            }
            continue;
        }

        const start = Date.now();
        lastExitCode = await runCommand(cmd);
        lastDuration = Date.now() - start;
    }
}

loop().catch((e) => {
    console.error(e);
    process.exit(1);
})