import chalk from "chalk";
import { readFileSync } from "fs";
import { join } from "path";

export default {
    name: "version",
    aliases: ["v"],
    run: async ({ print }) => {
        const packageJson = JSON.parse(
            readFileSync(join(process.cwd(), "package.json"), "utf8")
        );
        print(chalk.hex("#a371f7")(`
                ${chalk.bold("xsh")} - v${packageJson.version}
            `));
        return { code: 0 };
    },
};