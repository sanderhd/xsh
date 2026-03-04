import fs from "fs";
import os from "os";
import path from "path";

const rcPath = path.join(os.homedir(), ".xshrc");

function loadConfig() {
    try {
       if (fs.existsSync(rcPath)) {
            const data =fs.readFileSync(rcPath, "utf-8");
            return JSON.parse(data);
        } 
    } catch {
        // uhh
    }
    return {};
}

function saveConfig(config) {
    try {
        fs.writeFileSync(rcPath, JSON.stringify(config, null, 4), "utf-8");
        return true;
    } catch {
        return false;
    }
}

function getConfigValue(key) {
    const config = loadConfig();
    const keys = key.split(".");
    let value = config;

    for (const k of keys) {
        if (value === undefined || value === null) return undefined;
        value = value[k];
    }
    return value;
}

function setConfigValue(key, value) {
    const config = loadConfig();
    const keys = key.split(".");
    let obj = config;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]] || typeof obj[keys[i]] !== "object") {
            obj[keys[i]] = {};
        }
        obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    return saveConfig(config);
}

function getConfigPath() {
    return rcPath;
}

export { loadConfig, saveConfig, getConfigValue, setConfigValue, getConfigPath };