import chalk from "chalk";

export default {
    name: "exit",
    aliases: ["close", "quit", "q"],
    run: async ({ args, print }) => {
        print(chalk.hex("#a371f7")(`
                👋 Goodbye!
            `));
        process.exit(0);
    },
};