const express = require('express');
const dayjs = require('dayjs');
const { ReadLog } = require('./readLog.js');
const { FilterLog } = require('./filterLog.js');
const { LimitResults } = require('./limitResults.js');

const app = express();

const port = parseInt(process.argv[2]);
const filePath = process.argv[3];
const fileEncoding = process.argv[4];

const handleRequest = async (req, res, next) => {
    try {
        const { query } = req;
        let fileLines = await ReadLog(filePath, fileEncoding);
        const keywords = [];
        if (query.keyword) {
            if (Array.isArray(query.keyword)) {
                keywords.push(...query.keyword);
            } else {
                keywords.push(query.keyword);
            }
        }
        let rslts = FilterLog(fileLines, keywords);
        let limit = -1;
        if (query.limit) {
            try {
                limit = parseInt(query.limit);
            } catch (err) { }
        }
        res.json(LimitResults(rslts, limit));
    } catch (err) {
        console.log("Error occured while handling request: " + err.message);
        next(err);
    }
}

app.get(filePath, handleRequest);

try {
    app.listen(port, err => {
        err ?
            console.log(`Failed to listen on PORT ${port}`) :
            console.log(`Worker listening on PORT ${port} for requests for ${filePath}`);
    });
} catch (err) {
    throw err;
}