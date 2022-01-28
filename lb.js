
const bodyParser = require('body-parser');
const config = require('config')
const express = require('express');
const fs = require('fs');
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

const AddLogFileRoute = (app, lfr) => {
    if (!lfr) {
        throw new Error("Log File Route parameters not provided");
    } else if (!lfr.routePath) {
        throw new Error("Route path not provided");
    } else if (!lfr.filePath) {
        throw new Error("File path not provided");
    } else if (!lfr.encoding) {
        throw new Error("File encoding not provided");
    } else if (!fs.existsSync(lfr.filePath)) {
        let err = new Error(`${lfr.filePath} does not exist`)
        err.name = 'FILE_NOT_FOUND';
        throw err;
    }
    app.get(lfr.routePath, async (req, res) => {
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
        }
    });
}

const app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/favicon.ico', (req, res) => res.status(204));

logFileRoutes.forEach(lfr => {
    try {
        AddLogFileRoute(app, lfr);
    } catch (err) {
        console.log(`Could not add log file route because ${err.message}`);
    }
});

/*
 * TODO: Save added route to disk
 */
app.post("/admin/cfg/alfr", (req, res) => {
    let f = req.get("X-AuthToken");
    if (!req.get("X-AuthToken") || req.get("X-AuthToken") != 'easytocrack') {
        res.sendStatus(401);
    } else {
        let lfr = req.body;
        if (!lfr.routePath) {
            res.status(400).send("Missing route path");
        } else if (!lfr.filePath) {
            res.status(400).send("Missing file path");
        } else if (!lfr.encoding) {
            res.status(400).send("Missing file encoding");
        } else {
            try {
                AddLogFileRoute(app, lfr);
                res.send(`Successfully added route for ${lfr.filePath}`);
            } catch (err) {
                if (err.name == 'FILE_NOT_FOUND') {
                    res.status(404).send(err.message);
                }
            }
        }
    }
});

app.listen(port, err => {
    err ?
        console.log(`Failed to listen on PORT ${port}`) :
        console.log(`Load Balancer Server listening on PORT ${port}`);
});