import chalk from "chalk";
import icons from "../config/icons.json" with { type: "json" }

export default {
    name: "exit",
    aliases: ["close", "quit", "q"],
    run: async ({ args, print }) => {
        print(chalk.hex("#a371f7")(`
                ${icons.exit} Goodbye!
            `));
        process.exit(0);
    },
};