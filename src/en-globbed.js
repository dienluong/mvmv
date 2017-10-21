const glToRe  = require('glob-to-regexp');
// var path    = require('path');
// var mm      = require('micromatch');

/**
 * The module determines the match of each wildcard of the provided glob, applied to an array of strings.
 * @module englobbed
 */

/**
 * For each path received in the array (1st argument), returns an array containing the match of each parts of the glob pattern (2nd argument).
 * @method englobbed
 * @param paths {Array} List of paths
 * @param glob {String} The glob pattern
 * @return {Array} An array of arrays. First sub-array is tied to first path.
 *                 - If the glob matches the given path, then each element of sub-array is an object for the match of each group of the glob pattern;
 *                 - If there is no match, then the sub-array is empty;
 *                 - If there's an error, it's an object with an 'error' property, instead of an sub-array.
 * @throws {TypeError} Arguments of incorrect type.
 */
function englobbed(paths, glob) {
    "use strict";
    if (!Array.isArray(paths)) {
        throw new TypeError('Expects an array of paths.');
    }

    if ((typeof glob !== 'string') || !glob.length) {
        throw new TypeError('Expects non-empty string.');
    }

    // Transform glob pattern to equivalent regex
    let re = glToRe(glob, {extended: true});
    // console.log('Gl-to-Re:    ' + re);

    // Add capture groups to various parts of the regex
    re = addCaptureGroups(re);
    // console.log("re: " + re);

    // Produce an array of all capture groups from the regex
    let captureGroups = extractCaptureGroups(re);
    // Produce array of groups (* , ? or literal) from glob string
    // let captureGroups = extractGroups(glob);

    // console.log("Capture groups: " + captureGroups);

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
            if (typeof p !== 'string') {
                return { error: 'Invalid type' };
            }

            // let matches = path.basename(p).match(re);
            let matches = p.match(re);
            if (!matches) {
                return [];
            }
            // console.log(matches);
            // console.log(captureGroups);

            // String.match() returns the entire match *and* the capture group matches;
            // so its array length must be > then the length of the capture groups array
            if (matches.length <= captureGroups.length) {
                return { error: `Error! matches.length: ${matches.length}, captureGroups: ${captureGroups.length}` };
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
                    // Remove escape character \ from the regex pattern.
                    g = g.replace(/\\/g, '');
                    matchPerCG.push({
                        type: "literal",
                        pattern: g,
                        match: matches[idx + 1]
                    });
                }
            });

            // console.log(matchPerCG);
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

/**
 * Add capture groups to a regular expression.
 * Example: abc.123.*DEF --> (abc)(.)(123)(.*)(DEF)
 * @method addCaptureGroups
 * @private
 * @param re {RegExp} The regular expression to process
 * @returns {RegExp} Regular expression with capture groups added
 */
function addCaptureGroups(re) {
    "use strict";
    if ((typeof re.source) !== 'string') {
        return null;
    }
    // Only enclose in capture group '.' that is not part of regex "\." or ".*"
    let tmpStr = re.source.replace(/\.(?!\*)/g, function encloseRegexDot(match, offset, source) {
        // if "\." (a literal '.'), then do not enclose in capture group
        if (offset && (source.charAt(offset - 1) === '\\')) {
            return match;
        }
        // if ".*", then return, will enclose in capture group in a later step.
        /* TO REMOVE.  NOT NEEDED anymore since we use (?!\*) negative look-ahead */
        // if (source.charAt(offset + 1) === '*') {
        //     return match;
        // }

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

    // Temporarily remove ^
    let start = '';
    if (tmpStr.charAt(0) === '^') {
        tmpStr = tmpStr.slice(1);
        start = '^';
    }
    // Temporarily remove $
    let end = '';
    if (tmpStr.charAt(tmpStr.length - 1) === '$') {
        tmpStr = tmpStr.slice(0, tmpStr.length - 1);
        end = '$';
    }

    // Enclose in capture group remaining substrings...
    // Regex description: matches any number of characters, except * ( and ), that is not followed by ) or * (we don't want to match ".*" again)
    tmpStr = tmpStr.replace(/([^\*\(\)]+(?![\*\)]))/g, '($&)');

    tmpStr = start + tmpStr + end;

    /*
     console.log('tmpStr: ' + tmpStr);
     */

    /*
     console.log('Gl-to-Re Mod: ' + re);
     */

    return new RegExp(tmpStr);
}

/**
 * Extracts the capture groups of a regular expression and returns them in an array
 * @method extractCaptureGroups
 * @private
 * @param re {RegExp} The regular expression to process
 * @returns {Array} List of extracted capture groups
 */
function extractCaptureGroups(re) {
    "use strict";
    let captureGroups = [];
    let source = re.source;
    let start = source.indexOf('(', 0);

    while (start !== -1) {
        let end = source.indexOf(')', start);
        if (end === -1) {
            end = source.length;
        }
        // do not include the parens
        let token = source.slice(start + 1, end);
        if (token === '.') {
            token = '?';
        }
        if (token === '.*') {
            token = '*';
        }
        captureGroups.push(token);
        start = source.indexOf('(', end + 1);
    }

    return captureGroups;
}

function extractGroups(glob) {
    "use strict";
    let groups = [];
    let end;
    let subGlob;
    // if not a string or empty string, return empty array
    if (typeof glob !== 'string' || !glob) {
        return groups;
    }
    // Any multiple consecutive * is equivalent to a single *
    subGlob = glob.replace(/\*{2,}/,'*');

    end = subGlob.search(/[*|?]/g);
    while (end !== -1) {
        // Example: abc*def -> groups [abc][*][def]
        if (end !== 0) {
            groups.push(subGlob.slice(0, end));
        }
        groups.push(subGlob.charAt(end));
        subGlob = subGlob.substr(end+1);
        end = subGlob.search(/[*|?]/g);
    }

    if (subGlob) {
        groups.push(subGlob);
    }

    return groups;
}

module.exports = exports = englobbed;
