import chalk from "chalk";

export default {
    name: "reload",
    aliases: ["r"],
    run: async ({ print }) => {
        print(chalk.hex("#a371f7")(`
                ${chalk.bold("xsh")} - Reloaded commands!
            `));
        process.emit("reloadCommands");
        return { code: 0 };
    },
};