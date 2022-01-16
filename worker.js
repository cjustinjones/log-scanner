const express = require('express');
const dayjs = require('dayjs');
const { ReadLog, GetLastModified } = require('./util.js');

const app = express();

const port = parseInt(process.argv[2]);
const filePath = process.argv[3];
const fileEncoding = process.argv[4];

let fileLines;
let prevLastModified;

app.get(filePath, async (req, res, next) => {
    try {
        const { query } = req;
        if (!fileLines) {
            console.log(`Reading ${filePath} for the first time`);
            prevLastModified = await GetLastModified(filePath);
            fileLines = await ReadLog(filePath, fileEncoding);
            fileLines.reverse();
        } else {
            let currLastModified = await GetLastModified(filePath);
            if (prevLastModified.isBefore(currLastModified)) {
                console.log(`${filePath} has been updated since ${prevLastModified.format()}... reloading from FS`);
                prevLastModified = currLastModified;
                fileLines = await ReadLog(filePath, fileEncoding);
                fileLines.reverse();
            }
        }
        if (query.limit && parseInt(query.limit) > 0) {
            res.json(fileLines.slice(0, parseInt(query.limit)));
        } else {
            res.json(fileLines);
        }
    } catch (err) {
        console.log("Error occured while handling request: " + err.message);
        next(err);
    }
});

try {
    app.listen(port, err => {
        err ?
            console.log(`Failed to listen on PORT ${port}`) :
            console.log(`Worker listening on PORT ${port} for requests for ${filePath}`);
    });
} catch (err) {
    throw err;
}