import chalk from "chalk";
import { select, input, confirm } from "@inquirer/prompts";
import { getTheme, getThemeName, setTheme, listThemes } from "../functions/themeManager.js";
import { getConfigValue, setConfigValue, getConfigPath, resetConfig, getDefaultConfig, loadConfig } from "../functions/configManager.js";
import icons from "../config/icons.json" with { type: "json" };

function printHelp(print, theme) {
    print(chalk.hex(theme.accentColor)(`
        ${icons.xsh} ${chalk.bold("config")} - manage xsh configuration
        
        ${chalk.bold("Usage:")}
            config               Open interactive configuration menu
            config --help        Show this help message
            config --reset       Reset configuration to default values
            config --show        Show current configuration values
            config --path        Show path to configuration file

            ${chalk.bold("Aliases:")} cfg, settings
        `))
}

export default {
    name: "config",
    aliases: ["cfg", "settings"],
    run: async ({ args, print }) => {
        const theme = getTheme();

        if (args.includes("--help") || args.includes("-h")) {
            printHelp(print, theme);
            return { code: 0 };
        }

        if (args.includes("--reset") || args.includes("-r")) {
            try {
                const sure = await confirm({
                    message: chalk.hex(theme.warningColor)("Are you sure you want to reset all configuration values to their defaults? This cannot be undone."),
                    default: false,
                });
                if (!sure) {
                    print(chalk.hex(theme.accentColor)("Cancelled."));
                    return { code: 0 };
                }
            } finally {
                process.stdin.setRawMode(true);
                process.stdin.resume();
            }

            const success = resetConfig();
            if (success) {
                setTheme("default");
                print(chalk.hex(theme.successColor)("Configuration reset to defaults."));
            } else {
                print(chalk.hex(theme.errorColor)("Failed to reset configuration."));
            }
            return {code: success ? 0 : 1};
        }

        if (args.includes("--show") || args.includes("-s")) {
            const config = loadConfig();
            print(chalk.hex(theme.accentColor)(`Current configuration:\n${JSON.stringify(config, null, 4)}`));
            return { code: 0 };
        }

        if (args.includes("--path") || args.includes("-p")) {
            print(chalk.hex(theme.accentColor)(`Configuration file path: ${getConfigPath()}`));
            return { code: 0 };
        }

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