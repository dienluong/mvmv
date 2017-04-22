var path    = require('path');
var glToRe  = require('glob-to-regexp');
// var mm      = require('micromatch');

function englobbed(paths, glob) {
    "use strict";
    if (!Array.isArray(paths)) {
        throw new TypeError('Expects an array of paths.');
    }

    let re = glToRe(glob, {extended: true});
/*
    console.log('Gl-to-Re:    ' + re);
*/
    re = addCaptureGroups(re);

    // Produce an array of all capture groups from the regex
    let captureGroups = extractCaptureGroups(re);

    // let re2 = mm.makeRe(glob);
    // console.log('Micromatch    :' + re2);
    // re2 = new RegExp(re2.source.replace('(?:', '('));
    // console.log('Micromatch mod:' + re2);

    // For each paths received, return an array containing the match for each capture group,
    // i.e. returns an array of array of match per capture group.
    return paths.map(function buildMatchPerCGArray(p) {
        try {
/*
            console.log("gltoRe:\n");
*/
            let matches = path.basename(p).match(re);
/*
            console.log(matches);
*/

            if (matches.length <= captureGroups.length) {
                throw new Error(`matches.length: ${matches.length}, captureGroups: ${captureGroups.length}`);
            }

            let matchPerCG = [];

            captureGroups.forEach(function (g, idx) {
                // only produce result for capture group for wildcard ? and *
                // [idx + 1] because whole match is first element of array of matches
                if (g === '?' || g === '*') {
                    matchPerCG.push({
                        type: "wildcard",
                        pattern: g,
                        match: matches[idx + 1]
                    });
                }
                else {
                    matchPerCG.push({
                        type: "literal",
                        pattern: g,
                        match: matches[idx + 1]
                    });
                }
            });

            console.log(matchPerCG);
            // let match2 = p.match(re2);
            // console.log("Micromatch:\n");
            // console.log(match2);
            // console.log('\n');

            return matchPerCG;
        }
        catch(e) {
            // console.log(e.message);
            return { error: e.message };
        }
    });
}

function addCaptureGroups(re) {
    "use strict";
    // Enclose in capture group the regex '.'
    let tmpStr = re.source.replace(/\./g, function encloseRegexDot(match, offset, source) {
        // if "\.", then it's a literal '.', return
        if (offset && (source[offset - 1] === '\\')) {
            return match;
        }
        // if ".*", then return
        if (source[offset + 1] === '*') {
            return match;
        }

        // Only enclose in capture group '.' that is not part of "\." or ".*"
        return (`(${match})`);
    });
    /*
     console.log('tmpStr: ' + tmpStr);
     */

    // Enclose in capture group the regex '.*'
    tmpStr = tmpStr.replace(/\.\*/g, '($&)');
    /*
     console.log('tmpStr: ' + tmpStr);
     */

    // Enclose in capture group remaining substrings...
    tmpStr = tmpStr.replace(/([^\*\(\)\$\^]+(?![\*\)]))/g, '($&)');
    /*
     console.log('tmpStr: ' + tmpStr);
     */

    /*
     console.log('Gl-to-Re Mod: ' + re);
     */

    return new RegExp(tmpStr);
}

function extractCaptureGroups(re) {
    "use strict";
    let captureGroups = [];
    let source = re.source;
    let start = source.indexOf('(', 0);

    while (start !== -1) {
        let end = source.indexOf(')', start);
        if (end !== -1) {
            // do not include the parens
            let token = source.slice(start + 1, end);
            if (token === '.') {
                token = '?';
            }
            if (token === '.*') {
                token = '*';
            }
            captureGroups.push(token);
        }
        start = source.indexOf('(', end + 1);
    }

    return captureGroups;
}

module.exports = exports = englobbed;
