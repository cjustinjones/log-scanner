const dayjs = require('dayjs');
const fs = require('fs');
const readline = require('readline');

const ReadLines = async (path, encoding) => {
    let lines = [];
    let stats = await GetStats(path);
    if (stats.isFile) {
        let rstream = fs.createReadStream(path, { encoding: encoding });
        const rl = readline.promises.createInterface({
            input: rstream
        });
        for await (const line of rl) {
            lines.push(line);
        }
    } else {
        throw new Error(`${path} is not a file`);
    }
    return lines;
}

const GetLastModified = async (path) => {
    let stats = await GetStats(path);
    return stats.lastModified;
}

const GetStats = async (path) => {
    let fstats = await fs.promises.stat(path);
    let mtime = dayjs(fstats.mtimeMs);
    if (!mtime.isValid()) {
        throw new Error(`Could not parse mtimeMs for ${path}`);
    }
    return { lastModified: mtime, isFile: fstats.isFile() };
}

module.exports = { ReadLines, GetLastModified };