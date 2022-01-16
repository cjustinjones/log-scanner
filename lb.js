const express = require('express');
const app = express();
const axios = require('axios');
const { fork } = require("child_process");

const controller = new AbortController();
const { signal } = controller;

/*
 * Load balancer idea taken from 
 * https://www.geeksforgeeks.org/how-to-create-load-balancing-servers-using-node-js/ by @braktim99
 * Customer must be able to query the following:for a specific file in /var/loglast   events of specified filenbasic text/keyword filtering of eventsThe results returned must be reverse time ordere
 */

const workers = new Map([
    ["/var/log/syslog", { "port": 3001, "encoding": "utf8" }],
    ["/var/log/auth.log", { "port": 3002, "encoding": "utf8" }],
    ["/var/log/kern.log", { "port": 3003, "encoding": "utf8" }],
    ["/windows/logs/DAX2_API_Install.log", { "port": 3004, "encoding": "utf16le" }]
]);
console.log("Getting " + workers.get("/var/log/syslog").port);

const getWorkerUrl = (file, port) => `http://localhost:${port}${file}`;

const LaunchWorkers = (workers) => {
    workers.forEach((v, k) => {
        console.log(`Starting worker for ${k} on port ${v.port}`)
        v.proc = fork(
            "worker.js", [v.port, k, v.encoding], { signal: signal, killSignal: 'SIGINT' }
        )
        v.proc.on("error", (err) => {
            if (err.code === 'ABORT_ERR') {
                console.log(`Worker handling ${k} on port ${v.port} received the ABORT`)
            } else {
                console.log(err.message);
            }
        })
        v.proc.on("close", () => {
            console.log(`Worker handling ${k} on port ${v.port} has closed`)
        })
    });
}

// Receive new request
// Forward to application server
const forwardHandler = async (req, res, next) => {
    const { method, headers, body, query, path } = req;
    try {
        const worker = workers.get(path);
        if (worker) {
            let workerUrl = getWorkerUrl(path, worker.port);
            console.log(`Sending request for ${path} to worker on port ${worker.port}`);
            try {
                const response = await axios({
                    url: workerUrl,
                    method: method,
                    headers: headers,
                    data: body,
                    params: query
                });
                res.send(response.data)
            } catch (err) {
                res.status(500).send("Internal Server Error!")
            }
        } else {
            res.status(404).send(`${path} is not available`);
        }
    } catch (err) {
        next(err);
    }
}

app.get('/favicon.ico', (req, res) => res.status(204));

app.use((req, res) => { forwardHandler(req, res) });

LaunchWorkers(workers);

const server = app.listen(8080, err => {
    err ?
        console.log("Failed to listen on PORT 8080") :
        console.log("Load Balancer Server listening on PORT 8080");
});

const shutdown = (sig) => {
    console.log(`${sig} signal received`)
    console.log("...closing Load Balancer")
    server.close(() => {
        console.log('Load Balancer has closed')
    });
    console.log("...closing Workers")
    controller.abort();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));