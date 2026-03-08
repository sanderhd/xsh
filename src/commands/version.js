import chalk from "chalk";
import { readFileSync } from "node:fs";
import { getTheme } from "../functions/themeManager.js";

const PACKAGE_NAME = "xsh-shell";

async function getLatestNpmVersion() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
        const response = await fetch(`https://registry.npmjs.org/${PACKAGE_NAME}/latest`, {
            signal: controller.signal,
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`npm registry request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (!data?.version) {
            throw new Error("npm registry response did not include a version");
        }

        return data.version;
    } finally {
        clearTimeout(timeout);
    }
}

function getLocalVersion() {
    const packageJsonPath = new URL("../../package.json", import.meta.url);
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    return packageJson.version;
}

export default {
    name: "version",
    aliases: ["v"],
    run: async ({ print }) => {
        const theme = getTheme();
        let version;

        try {
            version = await getLatestNpmVersion();
        } catch {
            version = getLocalVersion();
        }

        print(chalk.hex(theme.accentColor)(`
                ${chalk.bold("xsh")} - v${version}
            `));
        return { code: 0 };
    },
};