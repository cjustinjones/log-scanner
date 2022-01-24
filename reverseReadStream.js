
const fs = require('fs');
const { Readable } = require('stream');

const maxBufSize = 100000;

const ReverseRead = async (fd, encoding, fileSize, totalBytesRead) => {
    let readResponse = {
        lines: null,
        bytesRead: 0
    }
    const bytesRemaining = fileSize - totalBytesRead;
    if (bytesRemaining > 0) {
        const bufSize = bytesRemaining > maxBufSize ? maxBufSize : bytesRemaining;
        const filePos = fileSize - totalBytesRead - bufSize;
        const buf = Buffer.alloc(bufSize, 0, encoding);
        try {
            let rsp = await fd.read(buf, 0, bufSize, filePos);
            if (rsp.bytesRead > 0) {
                let s = rsp.buffer.slice(0, rsp.bytesRead).toString()
                readResponse.lines = s.split(/(\r\n?|\n)/);
                readResponse.bytesRead = rsp.bytesRead;
            }
        } catch (err) {
            console.log(err);
        }
    }
    return readResponse;
}

async function* ReverseReadLineGenerator(path, encoding, limit, keywords) {
    let fileHandle
    let yieldCount = 0;
    let regexp;
    if (keywords && keywords.length > 0) {
        regexp = new RegExp(keywords.join("|"), "i");
    }
    let noResults = true;
    try {
        const fstats = await fs.promises.stat(path);
        const fileSize = fstats.size;
        console.log(`Opening ${path}`);
        fileHandle = await fs.promises.open(path, 'r');
        let { lines: fileLines, bytesRead: totalBytesRead } = await ReverseRead(fileHandle, encoding, fileSize, 0);
        while (fileLines.length > 0) {
            let l = fileLines.pop();
            if (l.search(/./) >= 0) {
                if (!regexp || (regexp && l.match(regexp))) {
                    noResults = false;
                    if (limit == -1 || yieldCount < limit) {
                        yield l;
                        yieldCount++;
                    } else {
                        break;
                    }
                }
            }
            if (fileLines.length == 1) {
                let { lines, bytesRead } = await ReverseRead(fileHandle, encoding, fileSize, totalBytesRead);
                if (bytesRead > 0) {
                    totalBytesRead += bytesRead;
                    if ((fileLines[0].search(/./) >= 0) && (lines[lines.length - 1].search(/./) >= 0)) {
                        let l = lines.pop();
                        fileLines[0] = l.concat(fileLines[0]);
                    }
                    fileLines.unshift(...lines);
                }
            }
        }
        if (noResults) {
            yield 'No Results Found';
        }
    } catch (err) {
        console.log(`Error handling request for ${path}`);
        console.log(err);
    } finally {
        console.log(`Closing ${path}`);
        await fileHandle?.close();
    }
}

const ReverseReadStream = (path, encoding, limit, keywords) => Readable.from(ReverseReadLineGenerator(path, encoding, limit, keywords));

module.exports = { ReverseReadStream };
