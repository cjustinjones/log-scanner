
const LimitResults = (lines, limit) => {
    if (limit < 0) {
        return lines;
    } else {
        return lines.slice(0, limit);
    }
}

module.exports = { LimitResults }