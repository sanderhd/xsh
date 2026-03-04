import fs from "fs";
import path from "path";
import os from "os";
import process from "process";

function uniq(arr) { return [...new Set(arr)]; }

function isWindows() {
    return process.platform === "win32";
}

function getPathExts() {
    const pathext = process.env.PATHEXT;
    return pathext ? pathext.split(";").map(e => e.toLowerCase()) : [".exe", ".cmd", ".bat"];
}

function listExecutablesSync() {
    const PATH = (process.env.PATH || "").split(path.delimiter);
    const exts = isWindows() ? getPathExts() : [""];
    const names = [];
    for (const dir of PATH) {
        try {
            const files = fs.readdirSync(dir);
            for (const f of files) {
                const full = path.join(dir, f);
                try {
                    const st = fs.statSync(full);
                    if (st.isFile()) {
                        if (isWindows()) {
                            const lower = f.toLowerCase();
                            if (exts.some(ext => lower.endsWith(ext))) {
                                names.push(path.parse(f).name);
                            }
                        } else {
                            if (st.mode & 0o111) names.push(f);
                        }
                    }
                } catch {}
            }
        } catch {}
    }
    return uniq(names).sort();
}

function resolvePrefixToDir(prefix, cwd = process.cwd()) {
    if (!prefix) return { dir: cwd, base: "" };
    let expanded = prefix.replace(/^~(?=$|[\\/])/, os.homedir());
    if (!path.isAbsolute(expanded)) expanded = path.join(cwd, expanded);
    if (expanded.endsWith(path.sep) || prefix.endsWith("/") || prefix.endsWith("\\")) {
        return { dir: expanded, base: "" };
    }
    return { dir: path.dirname(expanded), base: path.basename(expanded) };
}

function completePathSync(prefix, cwd = process.cwd()) {
    const { dir, base } = resolvePrefixToDir(prefix, cwd);
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const res = [];
        for (const e of entries) {
            if (!e.name.startsWith(base)) continue;
            const name = e.name + (e.isDirectory() ? path.sep : "");
            let out;
            if (/^[~./\\]/.test(prefix) || path.isAbsolute(prefix)) {
                const maybe = path.join(dir, name);
                out = maybe.replace(os.homedir(), "~");
            } else {
                out = name;
            }
            res.push(out);
        }
        return res.sort();
    } catch {
        return [];
    }
}

function listLocalBinsSync(cwd = process.cwd()) {
    const candidates = [];
    const nodeBin = path.join(cwd, "node_modules", ".bin");
    try {
        if (fs.existsSync(nodeBin)) {
            candidates.push(...fs.readdirSync(nodeBin).map(f => path.parse(f).name));
        }
    } catch {}
    return uniq(candidates);
}

function complete(buffer, cursor, customCommands = new Map()) {
    const before = buffer.slice(0, cursor);
    const tokenMatch = before.match(/(?:^|\s)([^\s]*)$/);
    const token = tokenMatch ? tokenMatch[1] : "";
    const replaceStart = cursor - token.length;
    const isFirst = /^\s*$/.test(buffer.slice(0, replaceStart));

    const looksLikePath = /^[~./\\]|[\\/]|^[a-zA-Z]:\\/.test(token);

    if (looksLikePath) {
        const candidates = completePathSync(token);
        return { candidates, replaceStart, replaceEnd: cursor };
    }

    const candidates = [];
    if (isFirst) {
        if (customCommands instanceof Map) candidates.push(...Array.from(customCommands.keys()));
        else if (Array.isArray(customCommands)) candidates.push(...customCommands);
        else if (customCommands && typeof customCommands === "object") candidates.push(...Object.keys(customCommands));

        candidates.push(...listExecutablesSync());
        candidates.push(...listLocalBinsSync());
        candidates.push(...completePathSync(token));
    } else {
        candidates.push(...completePathSync(token));
    }

    const filtered = uniq(candidates).filter(c => c && c.startsWith(token)).sort();
    return { candidates: filtered, replaceStart, replaceEnd: cursor };
}

export default {
    complete,
    completePathSync,
    listExecutablesSync,
    listLocalBinsSync,
};