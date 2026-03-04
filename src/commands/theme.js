import chalk from "chalk";
import { getTheme, getThemeName, setTheme, listThemes } from "../functions/themeManager.js";
import { getConfigPath } from "../functions/configManager.js";

export default {
    name: "theme",
    aliases: [],
    run({ args, print }) {
        const theme = getTheme();

        if (!args[0]) {
            print(chalk.hex(theme.accentColor)(`Current theme: `) + chalk.bold.hex(theme.successColor)(getThemeName()));
            print(chalk.hex(theme.accentColor)(`Available: `) + listThemes().map(t =>
                t === getThemeName()
                    ? chalk.bold.hex(theme.successColor)(t)
                    : chalk.hex(theme.primaryColor)(t)
            ).join(chalk.hex(theme.primaryColor)(", ")));
            return { code: 0 };
        }

        const result = setTheme(args[0]);
        if (!result) {
            print(chalk.hex(theme.errorColor)(`Theme "${args[0]}" not found. Available: ${listThemes().join(", ")}`));
            return { code: 1 };
        }

        const newTheme = getTheme();
        print(chalk.hex(newTheme.successColor)(`Theme changed to: `) + chalk.bold.hex(newTheme.accentColor)(args[0]));
        print(chalk.hex(newTheme.primaryColor)(`Saved to ${getConfigPath()}`));
        return { code: 0 };
    },
};