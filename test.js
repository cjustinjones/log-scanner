
const { FilterLog } = require('./filterLog.js');
const { LimitResults } = require('./limitResults.js');

test('FilterLog returns 4 lines containing "my" and "foo"', () => {
    const lines = [
        "foo", "bar", "baz", "another", "few", "lines", "have been",
        "added", "my my my", "foo my man", "you", "Synchronized",
        "bazoo", "baroo", "Foo"
    ];
    const keywords = ["my", "foo"]
    let rslts = FilterLog(lines, keywords);
    expect(rslts.length).toEqual(4);
    expect(rslts).toContain("my my my");
    expect(rslts).toContain("foo");
    expect(rslts).toContain("foo my man");
    expect(rslts).toContain("Foo");
});

test('FilterLog does not find "exciting" in file lines', () => {
    const lines = [
        "foo", "bar", "baz", "another", "few", "lines", "have been",
        "added", "my my my", "foo my man", "you", "Synchronized",
        "bazoo", "baroo", "Foo"
    ];
    const keywords = ["exciting"]
    let rslts = FilterLog(lines, keywords);
    expect(rslts.length).toEqual(0);
});

test('LimitResult returns first 5 results', () => {
    const lines = [
        "foo", "bar", "baz", "another", "few", "lines", "have been",
        "added", "my my my", "foo my man", "you", "Synchronized",
        "bazoo", "baroo", "Foo"
    ];
    let rslts = LimitResults(lines, 5);
    expect(rslts.length).toEqual(5);
    expect(rslts).toContain("foo");
    expect(rslts).toContain("bar");
    expect(rslts).toContain("baz");
    expect(rslts).toContain("another");
    expect(rslts).toContain("few");
});

test('LimitResult returns all results with limit = -1', () => {
    const lines = [
        "foo", "bar", "baz", "another", "few", "lines", "have been",
        "added", "my my my", "foo my man", "you", "Synchronized",
        "bazoo", "baroo", "Foo"
    ];
    let rslts = LimitResults(lines, -1);
    expect(rslts.length).toEqual(15);
});
test('FilterLog / LimitResults returns 2 lines containing "my" and "foo"', () => {
    const lines = [
        "foo", "bar", "baz", "another", "few", "lines", "have been",
        "added", "my my my", "foo my man", "you", "Synchronized",
        "bazoo", "baroo", "Foo"
    ];
    const keywords = ["my", "foo"]
    let rslts = FilterLog(lines, keywords);
    rslts = LimitResults(rslts, 2);
    expect(rslts.length).toEqual(2);
    expect(rslts).toContain("foo");
    expect(rslts).toContain("my my my");
    expect(rslts).not.toContain("foo my man");
    expect(rslts).not.toContain("Foo");
});