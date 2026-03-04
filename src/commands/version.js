import chalk from "chalk";
import { readFileSync } from "fs";
import { join } from "path";
import { getTheme } from "../functions/themeManager.js";

export default {
    name: "version",
    aliases: ["v"],
    run: async ({ print }) => {
        const theme = getTheme();
        const packageJson = JSON.parse(
            readFileSync(join(process.cwd(), "package.json"), "utf8")
        );
        print(chalk.hex(theme.accentColor)(`
                ${chalk.bold("xsh")} - v${packageJson.version}
            `));
        return { code: 0 };
    },
};