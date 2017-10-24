'use strict';

const glToRe  = require('glob-to-regexp');
// var path    = require('path');
// var mm      = require('micromatch');

/**
 * The module determines the match of each wildcard of the provided glob, applied to an array of strings.
 * @module englobbed
 */

/**
 * Returns the different parts (literals, wildcards) of a glob pattern.
 * @param glob {String} Glob to extract the parts from
 * @return {Array} The parts of the glob; empty array if glob is invalid (e.g. empty string)
 *                  Example: For glob 'abc*def' -> [ 'abc', '*', 'def' ]
 * TODO: Write test cases!
 */
function deconstruct(glob) {
    "use strict";
    let groups = [];
    let marker;
    let subGlob;
    // if not a string or empty string, return empty array
    if (typeof glob !== 'string' || !glob) {
        return [];
    }
    // Any multiple consecutive * is equivalent to a single *
    subGlob = glob.replace(/\*{2,}/,'*');

    marker = subGlob.search(/[*|?]/g);
    while (marker !== -1) {
        // If marker is not at first spot, everything before it is a group
        // Example: abc*def -> groups [abc][*][def]
        if (marker !== 0) {
            groups.push(subGlob.slice(0, marker));
        }
        // character at marker is itself a group of its own
        groups.push(subGlob.charAt(marker));
        // Truncate the portion already processed and continue with the remainder
        subGlob = subGlob.substr(marker+1);
        marker = subGlob.search(/[*|?]/g);
    }

    // Push remaining part of the glob, if not empty
    if (subGlob) {
        groups.push(subGlob);
    }

    return groups;
}

/**
 * For each name received in the array (1st argument), returns an array containing the match of each parts of the glob pattern (2nd argument).
 * @method capture
 * @param names {Array} List of names
 * @param glob {String} The glob pattern to be applied to names
 * @return {Array} An array of captureGroups objects. First captureGroups is for the first name.
 * @throws {TypeError} Arguments of incorrect type.
 */
function capture(names, glob) {
    "use strict";
    if (!Array.isArray(names)) {
        throw new TypeError('Expects an array of strings.');
    }

    if ((typeof glob !== 'string') || !glob.length) {
        throw new TypeError('Expects non-empty string for glob pattern.');
    }

    if (!names.length) {
        return [];
    }

    // Transform glob pattern to equivalent regex
    let re = glToRe(glob, {extended: true});
    // console.log('Gl-to-Re:    ' + re);

    // Wrap various parts of a regex with capture groups
    re = addCaptureGroups(re);
    // console.log("re: " + re);

    // Produce an array of all capture groups from a regex
    let captureGroupsArray = extractCaptureGroups(re);
    // Produce array of groups (* , ? or literal) from glob string
    // let captureGroupsArray = extractGroups(glob);

    // console.log("Capture groups: " + captureGroupsArray);

    // let re2 = mm.makeRe(glob);
    // console.log('Micromatch    :' + re2);
    // re2 = new RegExp(re2.source.replace('(?:', '('));
    // console.log('Micromatch mod:' + re2);

    // For each names received, return an array containing the match for each capture group,
    // i.e. returns an array of array of match per capture group.
    return names.map(function buildMatchPerCGArray(name) {
        let groupsObj = captureGroupsFactory();
        groupsObj.buildGroups(name, re, captureGroupsArray);
        return groupsObj;
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

/*
*                 - If the glob matches the given name, then each element of sub-array is an object
*                   for each group of the glob pattern; Examples:
*                              {type: 'literal', pattern: 'h', match: 'h'}
*                              {type: 'wildcard', pattern: '*', match: 'omer.js'}
*                 - If there is no match, then the sub-array is empty;
*                 - If there's an error, sub-array contains an Error object.
*                 - Returns empty array if list of names received is empty
*/
function captureGroupsFactory() {
    let groups      = [];   // list of all groups
    let asterisk    = [];   // list of index for groups for * wildcard
    let questionMark = [];  // list of index for groups for ? wildcard

    function initGroups(g) {
        buildGroups(g);
    }

    function getGroups() {
        return groups;
    }

    function buildGroups(name, re, captureGroups) {
        if (typeof name !== 'string' || !Array.isArray(captureGroups)) {
            groups = [ new TypeError('Invalid type') ];
        }

        // let matches = path.basename(p).match(re);
        let matches = name.match(re);
        if (!matches) {
            groups = [];
        }

        // String.match() returns the entire match *and* the capture group matches;
        // so its array length must be > then the length of the capture groups array
        if (matches.length <= captureGroups.length) {
            groups = [ new Error(`Error: length mismatch! matches: ${matches.length}, groups: ${captureGroupsArray.length}`) ];
        }

        captureGroups.forEach(function (g, idx) {
            // only produce result for capture group for wildcard ? and *
            // [idx + 1] because whole match is first element of array of matches
            if (g === '?' || g === '*') {
                groups.push({
                    type: "wildcard",
                    pattern: g,
                    match: matches[idx + 1]
                });
            }
            else {
                // Remove escape character \ from the regex pattern.
                g = g.replace(/\\/g, '');
                groups.push({
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
    }

    function getAsterisk() {
        if (groups) {
            groups.filter(function findAsterisk(g) {
                if (g.type === 'wildcard') {
                    if (g.pattern === '*' && g.pattern === '?') {
                        return true;
                    }
                }
            })
        }
        else {
            return [];
        }
    }

    function getQuestionMark() {

    }

    return {
        initGroups: initGroups,
        getGroups: getGroups,
        buildGroups: buildGroups,
        getAsterisk: getAsterisk,
        getQuestionMark: getQuestionMark
    };
}

module.exports.capture = capture;
module.exports.deconstruct = deconstruct;
