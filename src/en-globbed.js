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
    // Add capture group for regex '.'
    let tmpStr = re.source.replace(/\./g, function (match, offset, source) {
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
    // Add capture group for regex '.*'
    tmpStr = tmpStr.replace(/\.\*/g, '($&)');
/*
    console.log('tmpStr: ' + tmpStr);
*/
    // Add capture group for substrings not already enclosed in capture group...
    tmpStr = tmpStr.replace(/([^\*\(\)\$\^]+(?![\*\)]))/g, '($&)');
/*
    console.log('tmpStr: ' + tmpStr);
*/
    re = new RegExp(tmpStr);
/*
    console.log('Gl-to-Re Mod: ' + re);
*/

    // Produce an array of all capture groups from the regex
    let captureGroups = re.source.split(')')
        .map(function (g) {
            // remove everything up to, and including, '('
            let token = g.slice(g.indexOf('(') + 1);
            if (token === '.') {
                return '?';
            }
            if (token === '.*') {
                return '*';
            }
            return token;
        });

    // let re2 = mm.makeRe(glob);
    // console.log('Micromatch    :' + re2);
    // re2 = new RegExp(re2.source.replace('(?:', '('));
    // console.log('Micromatch mod:' + re2);

    return paths.map(function (p) {
        try {
            let basename = path.basename(p);

/*
            console.log("gltoRe:\n");
*/
            let matches = basename.match(re);
/*
            console.log(matches);
*/

            if (matches.length !== captureGroups.length) {
                throw new Error(`matches.length: ${matches.length}, captureGroups: ${captureGroups.length}`);
            }

            let results = [];

            captureGroups.forEach(function (g, idx) {
                // only produce result for capture group for wildcard ? and *
                // [idx + 1] because whole match is first element of array of matches
                if (g === '?' || g === '*') {
                    results.push({
                        wildcard: g,
                        match: matches[idx + 1]
                    });
                }
            });

            console.log(results);
            // let match2 = p.match(re2);
            // console.log("Micromatch:\n");
            // console.log(match2);
            // console.log('\n');

            return results;
        }
        catch(e) {
            // console.log(e.message);
            return { error: e.message };
        }
    })
}

module.exports =  exports = englobbed;
