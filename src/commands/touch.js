import path from "path";
import fs from "fs/promises";

export default {
    name: "touch",
    aliases: [],
    run: async ({ args, print }) => {
        if (args.length === 0) {
            print("Use: touch <file> [file2 ...]");
            return;
        }

        for (const file of args) {
            const target = path.resolve(process.cwd(), file);

            try {
                await fs.writeFile(target, "", { flag: "a" });
                print(`Created file: ${file}`);
            } catch (err) {
                print(`Error with file ${file}: ${err.message}`);
            }
        }
    },
};