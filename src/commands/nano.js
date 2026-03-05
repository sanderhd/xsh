import fs from "fs";
import chalk from "chalk";
import readline from "readline";
import { getTheme } from "../functions/themeManager.js";

export default {
    name: "nano",
    run: async ({ args, print }) => {
        const theme = getTheme();
        const file = args[0];

        if (!file) {
            print(chalk.hex(theme.errorColor)("Usage: nano <file>"));
            return { code: 1 };
        }

        let lines = [""];
        let modified = false;
        
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, "utf8");
            lines = content.split("\n");
            if (lines.length === 0) lines = [""];
        }

        let cursorY = 0;
        let cursorX = 0;
        let scrollOffset = 0;

        const { rows, columns } = process.stdout;
        const contentHeight = rows - 3; 

        function drawScreen() {
            console.clear();

            const header = `GNU nano ${file}${modified ? " [Modified" : ""}`;
            console.log(chalk.bgHex(theme.backgroundColor).hex(theme.primaryColor)(header.padEnd(columns)));

            for (let i = 0; i < contentHeight; i++) {
                const lineIdx = i + scrollOffset;
                if (lineIdx < lines.length) {
                    const line = lines[lineIdx] || "";
                    console.log(line.slice(0, columns));
                } else {
                    console.log(chalk.hex("#444444")("~"));
                }
            }

            const footer = [
                "^X Exit",
                "^O Write Out",
                "^K Cut",
                "^U Paste"
            ].join(" ");
            console.log(chalk.bgHex(theme.backgroundColor).hex(theme.primaryColor)(footer.padEnd(columns)));

            const screenY = cursorY - scrollOffset + 1;
            const screenX = Math.min(cursorX, columns - 1);
            process.stdout.write(`\x1b[${screenY + 1};${screenX + 1}H`);
        }

        function insertChar(char) {
            const line = lines[cursorY];
            lines[cursorY] = line.slice(0, cursorX) + char + line.slice(cursorX);
            cursorX++;
            modified = true;
        }

        function deleteChar() {
            const line = lines[cursorY];
            if (cursorX > 0) {
                lines[cursorY] = line.slice(0, cursorX - 1) + line.slice(cursorX);
                cursorX--;
                modified = true;
            } else if (cursorY > 0) {
                cursorX = lines[cursorY - 1].length;
                lines[cursorY - 1] += lines[cursorY];
                lines.splice(cursorY, 1);
                cursorY--;
                modified = true;
            }
        }

        function deleteCharForward() {
            const line = lines[cursorY];
            if (cursorX < line.length) {
                lines[cursorY] = line.slice(0, cursorX) + line.slice(cursorX + 1);
                modified = true;
            } else if (cursorY < lines.length - 1) {
                lines[cursorY] += lines[cursorY + 1];
                lines.splice(cursorY + 1, 1);
                modified = true;
            }
        }

        function insertNewLine() {
            const line = lines[cursorY];
            const before = line.slice(0, cursorX);
            const after = line.slice(cursorX);
            lines[cursorY] = before;
            lines.splice(cursorY + 1, 0, after);
            cursorY++;
            cursorX = 0;
            modified = true;
        }

        function moveCursor(dy, dx) {
            cursorY = Math.max(0, Math.min(lines.length - 1, cursorY + dy));
            cursorX = Math.max(0, Math.min(lines[cursorY].length, cursorX + dx));

            if (cursorY < scrollOffset) {
                scrollOffset = cursorY;
            } else if (cursorY >= scrollOffset + contentHeight) {
                scrollOffset = cursorY - contentHeight + 1;
            }
        }

        function save() {
            try {
                fs.writeFileSync(file, lines.join("\n"));
                modified = false;
                return true;
            } catch (err) {
                return false;
            }
        }

        process.stdin.setRawMode(true);
        readline.emitKeypressEvents(process.stdin);

        drawScreen();

        return new Promise((resolve) => {
            function onKey(str, key) {
                if (key?.ctrl && key.name === "x") {
                    process.stdin.removeListener("keypress", onKey);
                    process.stdin.setRawMode(false);
                    console.clear();

                    if (modified) {
                        print(chalk.hex(theme.warningColor)("Save modified buffer? (y/n)"));
                        process.stdin.once("data", (answer) => {
                            if (answer.toString().toLowerCase().startsWith("y")) {
                                if (save()) {
                                    print(chalk.hex(theme.successColor)("File saved."));
                                } else {
                                    print(chalk.hex(theme.errorColor)("Error saving file."));
                                }
                            }
                            resolve({ code: 0 });
                        });
                    } else {
                        resolve({ code: 0 });
                    }
                    return;
                }

                if(key.ctrl && key.name === "o") {
                    if(save()) {
                        drawScreen();
                        process.stdout.write(`\x1b[${rows};1H`);
                        process.stdout.write(chalk.hex(theme.successColor)("[ Wrote file ]"));
                        setTimeout(() => drawScreen(), 1000);
                    }
                    return;
                }

                if (key?.name === "return") {
                    insertNewLine();
                    drawScreen();
                    return;
                }

                if (key?.name === "backspace") {
                    deleteChar();
                    drawScreen();
                    return;
                }

                if (key?.name === "delete") {
                    deleteCharForward();
                    drawScreen();
                    return;
                }

                if (key?.name === "up") {
                    moveCursor(-1, 0);
                    drawScreen();
                    return;
                }
                if (key?.name === "down") {
                    moveCursor(1, 0);
                    drawScreen();
                    return;
                }
                if (key?.name === "left") {
                    moveCursor(0, -1);
                    drawScreen();
                    return;
                }
                if (key?.name === "right") {
                    moveCursor(0, 1);
                    drawScreen();
                    return;
                }

                if (key?.name === "home") {
                    cursorX = 0;
                    drawScreen();
                    return;
                }
                if (key?.name === "end") {
                    cursorX = lines[cursorY].length;
                    drawScreen();
                    return;
                }

                if (str && !key?.ctrl && !key?.meta && str.length === 1) {
                    insertChar(str);
                    drawScreen();
                }
            }

            process.stdin.on("keypress", onKey);
        })
    }
}