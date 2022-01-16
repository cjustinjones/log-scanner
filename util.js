//const Buffer = require('buffer');
const fs = require('fs');
const readline = require('readline');

const ReadLog = async (path) => {
    let lines = [];
    let fstats = await fs.promises.stat(path);
    if (fstats.isFile()) {
        let rstream = fs.createReadStream(path, { encoding: 'utf16le' });
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

module.exports = ReadLog;