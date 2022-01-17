
const LimitResults = (lines, limit) => {
    if (limit < 0 || Number.isNaN(limit)) {
        return lines;
    } else {
        return lines.slice(0, limit);
    }
}

module.exports = { LimitResults }