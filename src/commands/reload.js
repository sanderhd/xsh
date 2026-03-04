import chalk from "chalk";
import { getTheme } from "../functions/themeManager.js";

export default {
    name: "reload",
    aliases: ["r"],
    run: async ({ print }) => {
        const theme = getTheme();
        print(chalk.hex(theme.accentColor)(`
                ${chalk.bold("xsh")} - Reloaded commands!
            `));
        process.emit("reloadCommands");
        return { code: 0 };
    },
};