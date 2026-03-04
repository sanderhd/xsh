import chalk from "chalk";
import fs from "fs";
import { getTheme } from "../functions/themeManager.js";

export default {
    name: "cat",
    aliases: ["bat", "batcat", "get"],
    run: async ({ args, print }) => {
        const theme = getTheme();
        if (!args[0]) {
            print(chalk.hex(theme.errorColor)("Please provide a file path"));
            return;
        }

        try {
            const content = fs.readFileSync(args[0], "utf-8");
            print(chalk.hex(theme.accentColor)(content));
        } catch (error) {
            print(chalk.hex(theme.errorColor)(`Error reading file: ${error.message}`));
        }
    },
};