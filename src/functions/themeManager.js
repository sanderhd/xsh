import themes from "../config/themes.json" with { type: "json" };
import { getConfigValue, setConfigValue } from "./configManager.js";

const savedTheme = getConfigValue("theme");
let currentThemeName = themes[savedTheme] ? savedTheme : "default";
let theme = themes[currentThemeName];

export function setTheme(name) {
    if (!themes[name]) {
        return false;
    }
    currentThemeName = name;
    theme = themes[name];
    setConfigValue("theme", name)
    return true;
}

export function getTheme() {
    return theme;
}

export function getThemeName() {
    return currentThemeName;
}

export function listThemes() {
    return Object.keys(themes);
}