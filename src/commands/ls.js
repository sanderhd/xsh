import chalk from "chalk";
import fs from "fs";
import path from "path";
import icons from "../config/icons.json" with { type: "json" };

export default {
    name: "ls",
    aliases: ["la"],
    run: async ({ args, print }) => {
        try {
            const targetPath = args[0] ? path.resolve(args[0]) : ".";
            const files = fs.readdirSync(targetPath);

            const formattedFiles = files.map((file) => {
                const fullPath = path.join(targetPath, file);
                const stats = fs.statSync(fullPath);

                if (stats.isDirectory()) {
                    return chalk.hex("#6e40c9")(`${icons.folder} `) + chalk.hex("#a371f7")(file);
                } else {
                    return chalk.hex("#a371f7")(`${file}`);
                }
            }).join("\n");

            print(formattedFiles);
        }   catch (error) {
            print(chalk.red(`Error reading directory: ${error.message}`));
        }
    },
};