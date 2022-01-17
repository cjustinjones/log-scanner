
const FilterLog = (fileLines, keywords) => {
    let rslts;
    if (!keywords || keywords.length == 0) {
        rslts = fileLines;
    } else {
        rslts = [];
        let regexp = new RegExp(keywords.join("|"), "i");
        fileLines.forEach(l => {
            if (l.match(regexp)) {
                rslts.push(l);
            }
        })
    }
    return rslts;
}

module.exports = { FilterLog }