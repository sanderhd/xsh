import chalk from "chalk";
import readline from "node:readline"
import { exec } from "node:child_process"
import os from "node:os"
import path from "node:path"
import process, { stderr, stdout } from "node:process";

const icons = {
    sep: "",
    branch: "",
    ok: "✔",
    fail: "✖",
    folder: "",
    github: "",
};

let lastExitCode = 0;

function bg(hex) { return chalk.bgHex(hex); }
function fg(hex) { return chalk.hex(hex); }

function segment(text, { fgColor = "#000000", bgColor = "#ffffff"} = {}) {
    return bg(bgColor)(fg(fgColor)(` ${text} `));
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

async function renderPrompt() {
    const cwd = getCwdLabel();
    const branch = await getGitBranch();

    const status = lastExitCode === 0
        ? `${icons.ok} 0`
        : `${icons.fail} ${lastExitCode}`;

    const segs = [];

    segs.push({
        bgColor: lastExitCode === 0 ? "#6e40c9" : "#a371f7",
        render: segment(status, { fgColor: "#ffffff", bgColor: lastExitCode === 0 ? "#6e40c9" : "#a371f7" }),
    });

    segs.push({
        bgColor: "#7d4fd4",
        render: segment(`${icons.folder} ${cwd}`, { fgColor: "#ffffff", bgColor: "#7d4fd4" }),
    })

    if (branch) {
        segs.push({
            bgColor: "#a371f7",
            render: segment(`${icons.branch} ${branch}`, { fgColor: "#0d1117", bgColor: "#a371f7" }),
        });
    }

    const line1 = joinSegments(segs);
    const line2 = chalk.hex("#a371f7")("❯ ");

    return `${line1}\n${line2}`
}

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

let buffer = "";
let firstDraw = true;

function redraw(promptStr) {
    if (firstDraw) {
        firstDraw = false;
        process.stdout.write(promptStr + buffer);
    } else {
        process.stdout.write("\x1b[2K\x1b[G");
        process.stdout.write("\x1b[1A\x1b[2K\x1b[G");
        process.stdout.write(promptStr + buffer);
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
        const promptStr = await renderPrompt();
        redraw(promptStr);

        const exitCode = await new Promise((resolve) => {
            function onKey(str, key) {
                if (key?.ctrl && key.name === "c") {
                    process.stdout.write(chalk.reset("\n"));
                    process.exit(0);
                }

                if (key?.name === "return") {
                    process.stdin.off("keypress", onKey);
                    process.stdout.write("\n");
                    return resolve("ENTER");
                }

                if (key?.name === "backspace") {
                    buffer = buffer.slice(0, -1);
                    redraw(promptStr);
                    return;
                }

                if (key?.name === "tab") {
                    return;
                }

                if (key?.sequence && key.sequence.length === 1) {
                    buffer += key.sequence;
                    redraw(promptStr);
                }
            }

            process.stdin.on("keypress", onKey);
        });

        const cmd = buffer.trim();

        if (!cmd) {
            lastExitCode = 0;
            continue;
        }

        if (cmd === "exit") process.exit(0);

        if (cmd === "xsh" || cmd === "xsh -x") {
            console.log(chalk.hex("#a371f7")(`\n\nwelcome to xsh! `));
            console.log(chalk.gray(`a simple custom shell written in node.js\n\n`));
            
            lastExitCode = 0;
            continue;
        }

        if (cmd === "xsh --help" || cmd === "xsh -h") {
            console.log(chalk.hex("#a371f7")(`
                 xsh - a simple custom shell written in node.js

                usage:
                  xsh           [-x]    show a welcome message
                  xsh --help    [-h]    show this message
                  xsh --config  [-c]    show config file path
                  xsh --version [-v]    show version info
            `));

            lastExitCode = 0;
            continue;
        }

        if (cmd === "xsh --version" || cmd === "xsh -v") {
            const pkg = JSON.parse(await import("fs").then(m => m.promises.readFile("package.json", "utf-8")));
            console.log(chalk.hex("#a371f7")(`xsh version ${pkg.version}`));

            lastExitCode = 0;
            continue;
        }

        if (cmd === "xsh --config" || cmd === "xsh -c") {
            const configPath = path.join(os.homedir(), ".xshrc");
            await import("fs").then(m => m.promises.writeFile(configPath, "# xsh config file\n", { flag: "a" }));
            console.log(chalk.hex("#a371f7")(`xsh config file path: ${configPath}`));

            lastExitCode = 0;
            continue;
        }

        if (cmd === "clear") {
            process.stdout.write("\x1b[2J\x1b[H");
            lastExitCode = 0;
            continue;
        }

        if (cmd.startsWith("cd ")) {
            const target = cmd.slice(3).trim().replace(/^"(.*)"$/, "$1");
            const next = path.isAbsolute(target) ? target : path.join(process.cwd(), target);

            try {
                process.chdir(next);
                lastExitCode = 0;
            } catch {
                console.error(chalk.red(`cd: no such dir ${next}`));
                lastExitCode = 1;
            }
            continue;
        }

        lastExitCode = await runCommand(cmd);
    }
}

loop().catch((e) => {
    console.error(e);
    process.exit(1);
})