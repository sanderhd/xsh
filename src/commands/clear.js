export default {
    name: "clear",
    aliases: ["cls"],
    run: async ({ print }) => {
        print("\x1b[2J\x1b[H");
    },
};