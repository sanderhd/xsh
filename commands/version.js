import fs from "fs/promises";
export default {
	name: "version",
	aliases: ["v"],
	run: async ({ print }) => {
		try {
			const pkg = JSON.parse(await fs.readFile("package.json", "utf8"));
			print(`xsh version ${pkg.version}`);
			return { code: 0 };
		} catch (e) {
			print("unable to read package.json");
			return { code: 1 };
		}
	},
};
