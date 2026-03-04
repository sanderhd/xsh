import chalk from "chalk";
import fs from "fs";
import path from "path";
import icons from "../config/icons.json" with { type: "json" };
import { getTheme } from "../functions/themeManager.js";

export default {
    name: "ls",
    aliases: ["la"],
    run: async ({ args, print }) => {
        const theme = getTheme();
        try {
            const targetPath = args[0] ? path.resolve(args[0]) : ".";
            const files = fs.readdirSync(targetPath);

            const formattedFiles = files.map((file) => {
                const fullPath = path.join(targetPath, file);
                const stats = fs.statSync(fullPath);

                if (stats.isDirectory()) {
                    return chalk.hex(theme.promptColor)(`${icons.folder} `) + chalk.hex(theme.accentColor)(file);
                } else {
                    return chalk.hex(theme.accentColor)(`${file}`);
                }
            }).join("\n");

            print(formattedFiles);
        }   catch (error) {
            print(chalk.hex(theme.errorColor)(`Error reading directory: ${error.message}`));
        }
    },
};