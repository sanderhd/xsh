import path from "path";
import fs from "fs/promises";
import chalk from "chalk";
import icons from "../config/icons.json" with { type: "json" };
import { getTheme } from "../functions/themeManager.js";

export default {
    name: "mkdir",
    aliases: ["md"],
    run: async ({ args, print }) => {
        const theme = getTheme();
        const title = chalk.bold.hex(theme.accentColor);
        const success = chalk.hex(theme.successColor);
        const error = chalk.hex(theme.errorColor);
        const info = chalk.hex(theme.primaryColor);

        if (args.length === 0) {
            print(title(`${icons.folder} mkdir`) + "\n" + info("Usage: mkdir <folder> [folder2 ...]"));
            return { code: 1 };
        }

        for (const dir of args) {
            const target = path.resolve(process.cwd(), dir);

            try {
                await fs.mkdir(target, { recursive: true });

                print(`${success(icons.ok)} ${title("Created directory")} ${info(dir)}`);

            } catch (err) {

                print(`${error(icons.fail)} ${title("Failed to create")} ${info(dir)}\n${error(err.message)}`);

            }
        }

        return { code: 0 };
    },
};