import chalk from "chalk";
import fs from "fs";

export default {
    name: "cat",
    aliases: ["bat", "batcat", "get"],
    run: async ({ args, print }) => {
        if (!args[0]) {
            print(chalk.red("Please provide a file path"));
            return;
        }

        try {
            const content = fs.readFileSync(args[0], "utf-8");
            print(chalk.hex("#a371f7")(content));
        } catch (error) {
            print(chalk.red(`Error reading file: ${error.message}`));
        }
    },
};