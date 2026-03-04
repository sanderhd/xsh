import fs from "fs";
import readline from "readline";
import chalk from "chalk";
import { exit } from "process";

export default {
    name: "nano",
    run: async ({ args, print }) => {
        const file = args[0];

        if (!file) {
            print(chalk.red("Usage: nano <file>"));
            return;
        }

        let content = "";
        
        if (fs.existsSync(file)) {
            content = fs.readFileSync(file, "utf8");
        }

        console.clear();
        console.log(chalk.gray("Simple Nano - Ctrl+S = save | Ctrl+X = exit\n"));
        
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
                console.log(chalk.green("\nSaved."));
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