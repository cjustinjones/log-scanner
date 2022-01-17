
const dayjs = require('dayjs');
const { ReadLines, GetLastModified } = require('./util.js');

let fileLines;
let prevLastModified;

const ReadLog = async (filePath, fileEncoding) => {
    if (!fileLines) {
        console.log(`Reading ${filePath} for the first time`);
        prevLastModified = await GetLastModified(filePath);
        fileLines = await ReadLines(filePath, fileEncoding);
        fileLines.reverse();
    } else {
        let currLastModified = await GetLastModified(filePath);
        if (prevLastModified.isBefore(currLastModified)) {
            console.log(`${filePath} has been updated since ${prevLastModified.format()}... reloading`);
            prevLastModified = currLastModified;
            fileLines = await ReadLines(filePath, fileEncoding);
            fileLines.reverse();
        }
    }
    return fileLines;
}

module.exports = { ReadLog }