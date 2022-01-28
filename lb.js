
const config = require('config')
const express = require('express');
const { ReverseReadStream } = require('./reverseReadStream.js');
const { Transform } = require('stream');

let port;
if (config.has("server.port")) {
    port = config.get("server.port");
} else {
    port = 8080;
}

let defaultLineLimit;
if (config.has("defaultLineLimit")) {
    defaultLineLimit = config.get("defaultLineLimit");
} else {
    defaultLineLimit = 100;
}

let logFileRoutes;
if (config.has("logFileRoutes")) {
    logFileRoutes = config.get("logFileRoutes");
}
else {
    logFileRoutes = [];
}

const app = express();

app.get('/favicon.ico', (req, res) => res.status(204));

logFileRoutes.forEach(lfr => {
    app.get(lfr.routePath, async (req, res, next) => {
        const filePath = lfr.filePath;
        const fileEncoding = lfr.encoding;
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
            let limit = defaultLineLimit;
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
            ).pipe(addNewLine).pipe(res);
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