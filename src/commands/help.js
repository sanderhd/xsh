import chalk from "chalk";
import icons from "../config/icons.json" with { type: "json" };

export default {
    name: "help",
    aliases: ["h"],
    run: async ({ args, print }) => {
        print(chalk.hex("#a371f7")(`
            ${icons.xsh} xsh - a simple custom shell written in node.js

            usage:
              xsh           [-x]    show a welcome message
              xsh --help    [-h]    show this message
              xsh --config  [-c]    show config file path
              xsh --version [-v]    show version info
            `));
        return { code: 0 };
    },
};