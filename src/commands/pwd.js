import chalk from "chalk";
import { getTheme } from "../functions/themeManager.js";

export default {
    name: "pwd",
    aliases: ["path"],
    run: async ({ print }) => {
        const theme = getTheme();
        try {
            print(process.cwd());
        }   catch (error) {
            print(chalk.hex(theme.errorColor)(`Error reading directory: ${error.message}`));
        }
    },
};