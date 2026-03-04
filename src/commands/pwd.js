import chalk from "chalk";

export default {
    name: "pwd",
    aliases: ["path"],
    run: async ({ print }) => {
        try {
            print(process.cwd());
        }   catch (error) {
            print(chalk.red(`Error reading directory: ${error.message}`));
        }
    },
};