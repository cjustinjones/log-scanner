const express = require('express');
const { ReverseReadStream } = require('./reverseReadStream.js');
const { Transform } = require('stream');

const port = parseInt(process.argv[2]);

const workers = new Map([
    ["/var/log/syslog", { "encoding": "utf8" }],
    ["/var/log/auth.log", { "encoding": "utf8" }],
    ["/var/log/kern.log", { "encoding": "utf8" }],
    ["/users/preatl1cjj/dummy.txt", { "encoding": "utf8" }],
    ["/users/preatl1cjj/foo.log", { "encoding": "utf8" }],
    ["/users/preatl1cjj/dummy1.txt", { "encoding": "utf8" }]
]);

const DEFAULT_LIMIT = 100;

const app = express();

app.get('/favicon.ico', (req, res) => res.status(204));

workers.forEach((v, k) => {
    app.get(k, async (req, res, next) => {
        const filePath = k;
        const fileEncoding = v.encoding;
        try {
            const controller = new AbortController();
            req.on('close', () => {
                controller.abort();
            });
            const { query } = req;
            const keywords = [];
            if (query.keyword) {
                if (Array.isArray(query.keyword)) {
                    keywords.push(...query.keyword);
                } else {
                    keywords.push(query.keyword);
                }
            }
            let limit = DEFAULT_LIMIT;
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
            ReverseReadStream(
                filePath,
                fileEncoding,
                limit,
                keywords,
                controller.signal
            ).pipe(addNewLine).pipe(res).on('end', () => { console.log('foo') })
        } catch (err) {
            console.log("Error occured while handling request: " + err.message);
            next(err);
        } finally { }
    })
});

app.listen(port, err => {
    err ?
        console.log(`Failed to listen on PORT ${port}`) :
        console.log(`Load Balancer Server listening on PORT ${port}`);
});