import chalk from "chalk";
import icons from "../config/icons.json" with { type: "json" };
import { getTheme } from "../functions/themeManager.js";

export default {
    name: "exit",
    aliases: ["close", "quit", "q"],
    run: async ({ args, print }) => {
        const theme = getTheme();
        print(chalk.hex(theme.accentColor)(`
                ${icons.exit} Goodbye!
            `));
        process.exit(0);
    },
};