const express = require('express');
const path = require('path');
const readLog = require('./util.js');

const app = express();

const port = parseInt(process.argv[2]);
const filePath = process.argv[3];

let fileLines;

app.get(filePath, async (req, res) => {
    const { query } = req;
    if (!fileLines) {
        fileLines = await readLog(filePath)
        fileLines.reverse();
    }
    if (query.limit && parseInt(query.limit) > 0) {
        res.json(fileLines.slice(0, parseInt(query.limit)))
    } else {
        res.json(fileLines);
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