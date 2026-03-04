import chalk from "chalk";
import { select, input, confirm } from "@inquirer/prompts";
import { getTheme, getThemeName, setTheme, listThemes } from "../functions/themeManager.js";
import { getConfigValue, setConfigValue, getConfigPath } from "../functions/configManager.js";

export default {
    name: "config",
    aliases: ["cfg", "settings"],
    run: async ({ print }) => {
        const theme = getTheme();

        process.stdin.setRawMode(false);
        process.stdin.resume();

        try {
            const category = await select({
                message: chalk.hex(theme.accentColor)("Select a configuration category:"),
                choices: [
                    { name: "Theme", value: "theme" },
                    { name: "Prompt", value: "prompt" },
                    { name: "Other", value: "other" },
                    { name: "Cancel", value: "cancel" },
                ],
            });

            if (category === "cancel") {
                print(chalk.hex(theme.accentColor)("Cancelled."));
                return { code: 0 };
            }

            if (category === "theme") {
                const selectedTheme = await select({
                    message: chalk.hex(theme.accentColor)("Select a theme:"),
                    choices: listThemes().map(t => ({
                        name: t === getThemeName() ? `${t} (current)` : t,
                        value: t,
                    })),
                    default: getThemeName(),
                });
                setTheme(selectedTheme);
                const newTheme = getTheme();
                print(chalk.hex(newTheme.successColor)("Theme changed to: ") + chalk.bold.hex(newTheme.accentColor)(selectedTheme));
            }

            if (category === "prompt") {
                const symbol = await input({
                    message: chalk.hex(theme.accentColor)("Prompt symbol:"),
                    default: getConfigValue("prompt.symbol") || "❯",
                });
                const showGitBranch = await confirm({
                    message: "Show Git branch in prompt?",
                    default: getConfigValue("prompt.showGitBranch") ?? true,
                });
                const showExitCode = await confirm({
                    message: "Show exit code in prompt?",
                    default: getConfigValue("prompt.showExitCode") ?? true,
                });
                const showTime = await confirm({
                    message: "Show time in prompt?",
                    default: getConfigValue("prompt.showTime") ?? true,
                });
                const showDuration = await confirm({
                    message: "Show duration in prompt?",
                    default: getConfigValue("prompt.showDuration") ?? true,
                });

                setConfigValue("prompt.symbol", symbol);
                setConfigValue("prompt.showGitBranch", showGitBranch);
                setConfigValue("prompt.showExitCode", showExitCode);
                setConfigValue("prompt.showTime", showTime);
                setConfigValue("prompt.showDuration", showDuration);
                print(chalk.hex(theme.successColor)(`Prompt configuration updated and saved to ${getConfigPath()}`));
            }

            if (category === "other") {
                print(chalk.hex(theme.accentColor)("No other configurable options yet."));
            }
        } finally {
            process.stdin.setRawMode(true);
            process.stdin.resume();
        }

        return { code: 0 };
    },
};