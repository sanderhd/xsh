import fs from "fs";
import readline from "readline";
import chalk from "chalk";
import { exit } from "process";
import { getTheme } from "../functions/themeManager.js";

export default {
    name: "nano",
    run: async ({ args, print }) => {
        const theme = getTheme();
        const file = args[0];

        if (!file) {
            print(chalk.hex(theme.errorColor)("Usage: nano <file>"));
            return;
        }

        let content = "";
        
        if (fs.existsSync(file)) {
            content = fs.readFileSync(file, "utf8");
        }

        console.clear();
        console.log(chalk.hex(theme.primaryColor)("Simple Nano - Ctrl+S = save | Ctrl+X = exit\n"));
        
        console.log(content);

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        process.stdin.setRawMode(true);

        let buffer = content;

        process.stdin.on("data", (key) => {
            const str = key.toString();

            if (key[0] === 19) {
                fs.writeFileSync(file, buffer);
                console.log(chalk.hex(theme.successColor)("\nSaved."));
                return;
            }

            if (key[0] === 24) {
                console.clear();
                process.exit();
            }

            buffer += str;
            process.stdout.write(str);
        })
    }
}