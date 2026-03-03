export default {
    name: "reload",
    run: async ({ print, reload }) => {
        if (typeof reload === "function") reload();
        print("Commands opnieuw geladen.");
        return { code: 0 };
    },
};