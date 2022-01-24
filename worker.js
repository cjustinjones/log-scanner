const express = require('express');
const { ReverseReadStream } = require('./reverseReadStream.js');
const { Transform } = require('stream');

const app = express();

const port = parseInt(process.argv[2]);
const filePath = process.argv[3];
const fileEncoding = process.argv[4];

const handleRequest = async (req, res, next) => {
    try {
        const { query } = req;
        const keywords = [];
        if (query.keyword) {
            if (Array.isArray(query.keyword)) {
                keywords.push(...query.keyword);
            } else {
                keywords.push(query.keyword);
            }
        }
        let limit = -1;
        if (query.limit) {
            limit = parseInt(query.limit);
        }
        const addNewLine = new Transform({
            transform(chunk, encoding, callback) {
                if (Buffer.isBuffer(chunk)) {
                    chunk = chunk.toString()
                }
                this.push(chunk + "\n");
                callback();
            }
        });
        ReverseReadStream(filePath, fileEncoding, limit, keywords).pipe(addNewLine).pipe(res)
    } catch (err) {
        console.log("Error occured while handling request: " + err.message);
        next(err);
    } finally {
        res.end
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