'use strict';

const glToRe  = require('glob-to-regexp');
const groupsCollectionInterface = require('../src/captureGroupsCollectionInterface');

// var path    = require('path');
// var mm      = require('micromatch');

/**
 * The module determines the match of each wildcard of the provided glob, applied to an array of strings.
 * @module englobbed
 */

/**
 * Returns the different parts (literals, wildcards) of a glob pattern.
 * @param glob {String} Glob to extract the parts from
 * @param [options] {Object} options.collapse indicates whether consecutive * in glob pattern should collapse into a single *; default is false.
 * @return {String[]} The parts of the glob; empty array if glob is invalid (e.g. empty string)
 *                  Example: For glob 'abc*def' -> [ 'abc', '*', 'def' ]
 * TODO: Write test cases!
 */
function deconstruct(glob, options) {
    "use strict";
    let groups = [];
    let marker;
    let subGlob = glob;
    // if not a string or empty string, return empty array
    if (typeof glob !== 'string' || !glob) {
        return [];
    }

    if (options && options.collapse) {
        // Any multiple consecutive * is equivalent to a single *
        subGlob = glob.replace(/\*{2,}/,'*');
    }

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
 * For each element in names array (1st argument), return a captureGroupsCollection containing the match of each parts of the glob pattern (2nd argument).
 * Example of parts of a glob: "?omer.*" => Parts: 1) '?', 2) 'omer.', 3) '*'
 * @method capture
 * @param names {String[]} List of names
 * @param glob {String} The glob pattern to be applied to names
 * @return {captureGroupsCollection[]} An array of captureGroupsCollection objects. Returns null if invalid parameters or names list is empty.
 */
function capture(names, glob) {
    "use strict";
    if (!Array.isArray(names) || !names.length) {
        return null;
    }

    if ((typeof glob !== 'string') || !glob) {
        return null;
    }

    // Transform glob pattern to equivalent regex
    // TODO: choose one of the two methods for adding capture groups
    // let regex = glToRe(glob, {extended: true});
    // regex = __addCaptureGroups(regex);
    let regex = _convertToRegExWithCaptureGroups(glob);

    // (regex.source !== regex2.source) ? console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$') : console.log('');
    // console.log('Regex : ' + regex);
    // console.log('Regex2: ' + regex2);
    // console.log('Gl-to-Re:    ' + re);

   // Produce array of groups (* , ? or literal) from glob string
    // let captureGroupsArray = extractGroups(glob);

    // console.log("Capture groups: " + captureGroupsArray);

    // let re2 = mm.makeRe(glob);
    // console.log('Micromatch    :' + re2);
    // re2 = new RegExp(re2.source.replace('(?:', '('));
    // console.log('Micromatch mod:' + re2);

    // For each names received, return an object containing the match for each part of the glob,
    return names.map(function buildCaptureGroupsCollection(name) {
        let groupsObj = _captureGroupsCollectionFactory();
        groupsObj.initGroups(regex);
        groupsObj.buildGroups(name);
        return groupsObj;
    });
}


/**
 * Convert glob into regex with capture groups.
 * Example: abc.123.*DEF --> (abc)(.)(123)(.*)(DEF)
 * @method _convertToRegExWithCaptureGroups
 * @private
 * @param glob {String} The glob pattern
 * @returns {RegExp} Regular expression with capture groups added to the various parts
 */
function _convertToRegExWithCaptureGroups(glob) {
    let parts = deconstruct(glob, {collapse: true});

    let partsWithCaptureGroups = parts.map(function processPart(p) {
        if (typeof p === 'string') {
            switch (p) {
                case '*':
                    return '(.*)';
                    break;
                case '?':
                    return '(.)';
                    break;
                default:
                    // Escape all characters that must be escaped by using glob-to-regexp module
                    p = glToRe(p).source;
                    // Removes ^ and $ from the regexp source produced by glob-to-regexp
                    p = p.length > 2 ? p.slice(1, p.length - 1) : p;
                    return `(${p})`;
            }
        }
        else {
            return '';
        }
    });

    partsWithCaptureGroups.unshift('^');
    partsWithCaptureGroups.push('$');

    return new RegExp(partsWithCaptureGroups.join(''));
}


/**
 * Add capture groups to a regular expression.
 * Example: abc.123.*DEF --> (abc)(.)(123)(.*)(DEF)
 * @method __addCaptureGroups
 * @private
 * @param re {RegExp} The regular expression to process
 * @returns {RegExp} Regular expression with capture groups added to the various parts
 */
function __addCaptureGroups(re) {
    "use strict";
    if (!re || (typeof re.source) !== 'string') {
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
 *
 * @method _countRepeatingCharBackwards
 * @private
 * @param str {String} String to search
 * @param wanted {String} Character to look for
 * @param start {Number} Starting index
 * @returns {number} Number of successive occurrences of the character
 */
function _countRepeatingCharBackwards(str, wanted, start) {
    let count = 0;

    if ((typeof str !== 'string') || (typeof wanted !== 'string')) {
        return 0;
    }

    if (!Number.isFinite(start) || (start < 0) || (start >= str.length)) {
        return 0;
    }

    // search backwards in the string
    for (let i = start; i >= 0; i -= 1) {
        if (str.charAt(i) === wanted) {
            count += 1;
        }
        else {
            // returns as soon as chararacter is not 'wanted'
            return count;
        }
    }

    return count;
}

/**
 *
 * @method _findCaptureParensInRegExp
 * @private
 * @param re {RegExp}
 * @param start {Number}
 * @return {Number[]}
 */
function _findCaptureParensInRegExp(re, start) {
    if (!re || ((typeof re.source) !== 'string')) { return []; }

    if (!Number.isFinite(start)) { return []; }

    let source = re.source;
    let open, closing;
    let cursor;

    for (let i = start; i < source.length; i += 1) {
        cursor = source.indexOf('(', i);
        if (cursor === -1) { return []; }

        let count = _countRepeatingCharBackwards(source, '\\', cursor - 1);
        // If the number of repeating \ is even, then it is a literal '\' char in the regexp.
        // Consequently, the char on its right is not escaped.
        // So if the '(' found was not escaped, it is a capture paren; next is to look for the matching closing paren ')'
        if ((count % 2) === 0) {
            open = cursor;
            for (let j = open + 1; j < source.length; j += 1 ) {
                cursor = source.indexOf(')', j);
                if (cursor === -1) { return []; }

                count = _countRepeatingCharBackwards(source, '\\', cursor - 1);
                // if ')' found is an capture group closing paren, i.e. not escaped by \, then return the results;
                if ((count % 2) === 0) {
                    closing = cursor;
                    return [open, closing];
                }
                else {
                    // if ')' found is a literal ')' char, then continue search at cursor...
                    j = cursor;
                }
            }
        }
        else {
            // if '(' found is a literal '(' char, then continue search at cursor...
            i = cursor;
        }
    }

    return [];
}

/**
 * Extracts the expression inside capture groups of the received regular expression and returns them in an array
 * @method _extractCaptureGroups
 * @private
 * @param re {RegExp} The regular expression to process
 * @returns {String[]} List of extracted capture groups
 */
function _extractCaptureGroups(re) {
    "use strict";
    if (!re || (typeof re.source) !== 'string') {
        return [];
    }
    let source = re.source;
    let captureGroups = [];
    let parensIndexes = _findCaptureParensInRegExp(re, 0);
    while (parensIndexes.length > 1) {
        // grab the regex between the identified capture group parens
        captureGroups.push(source.slice(parensIndexes[0]+1, parensIndexes[1]));
        // Search next capture group parens
        parensIndexes = _findCaptureParensInRegExp(re, parensIndexes[1] + 1);
    }

    return captureGroups;
}


/**
 * Returns a captureGroupsCollection object.
 * @return {captureGroupsCollection} Object implementing the captureGroupsCollection interface.
 * @private
 */
function _captureGroupsCollectionFactory() {
    /**
     * @method initGroups
     * @param regex {RegExp} Regular expression with capture groups
     * @param text
     */
    function initGroups(regex, text) {
        if (this._groups) {
            // Do nothing if already groups already built
            return;
        }

        if (!regex) {
            return;
        }
        else {
            this._regexWithCapture = regex;

            // Produce an array of all capture groups from a regex
            this._regexCaptureGroupArray = _extractCaptureGroups(this._regexWithCapture);
        }

        if (text) {
            this.buildGroups(text);
        }
    }

    /**
     * Builds an array of group objects for each capture group in regex
     * @param text {String} The text to apply the regex on.
     * @param [regex] {String} regex used for math provided text
     * @return {Object[]} - If the glob matches the given text, then each element of the array is an object
     *                          for each "group" of the glob pattern; Example for glob 'h*':
     *                              {type: 'literal', pattern: 'h', match: 'h'}
     *                              {type: 'wildcard', pattern: '*', match: 'omer.js'}
     *                 - If there is no match, then array is empty;
     *                 - If there's an error, array contains an Error object.
     */
    function buildGroups(text, regex) {
        if (typeof text !== 'string') {
            this._groups = [ new TypeError('Invalid type! Expects a string.') ];
            return this._groups;
        }

        if (regex) {
            this.initGroups(regex);
        }

        if (!Array.isArray(this._regexCaptureGroupArray) || !this._regexWithCapture) {
            this._groups = [ new Error('Build failed! Object not initialized.') ];
            return this._groups;
        }

        // let matches = path.basename(p).match(re);
        let matches = text.match(this._regexWithCapture);
        if (!matches) {
            this._groups = [];
            return this._groups;
        }

        // String.match() returns the entire match *and* the capture group matches;
        // so its array length must be > then the length of the capture groups array
        if (matches.length <= this._regexCaptureGroupArray.length) {
            this._groups = [ new Error(`Error: length mismatch! matches: ${matches.length}, groups: ${this._regexCaptureGroupArray.length}`) ];
            return this._groups;
        }

        // Resets properties
        this._groups = [];
        this._questionMark = null;
        this._asterisk = null;

        this._regexCaptureGroupArray.forEach(function (g, idx) {
            // matches[idx + 1] because whole match is first element of the array of matches
            if (g === '.' || g === '.*') {
                let glob = (g === '.') ? '?' : '*';
                this._groups.push({
                    type: "wildcard",
                    pattern: glob,
                    match: matches[idx + 1]
                });
            }
            else {
                // Remove escape character \ from the regex pattern.
                g = g.replace(/\\/g, '');
                this._groups.push({
                    type: "literal",
                    pattern: g,
                    match: matches[idx + 1]
                });
            }
        }, this);

        return this._groups;
        // console.log(matchPerCG);
        // let match2 = p.match(re2);
        // console.log("Micromatch:\n");
        // console.log(match2);
        // console.log('\n');
    }

    function getGroups() {
        return this._groups;
    }

    function hasMatch() {
        return (this._groups !== null && this._groups.length !== 0 && !(this._groups[0] instanceof Error));
    }

    /**
     *
     * @return {Object[] | null} Array containing a match object for each wildcard '*' capture group; null if collection not built
     */
    function getAsterisk() {
        // if _groups initialized (not null)...
        if (this._groups) {
            if (!this.hasMatch()) {
                this._asterisk = [];
            }
            else {
                // if _asterisk not already built
                if (!Array.isArray(this._asterisk)) {
                    this._asterisk = this._groups.filter(function findAsterisk(g) {
                        return (g.type === 'wildcard' && g.pattern === '*');
                    });
                }
            }
            return this._asterisk;
        }
        else {
            return null;
        }
    }

    /**
     *
     * @return {Object[] | null} Array containing a match object for each wildcard '?' capture group; null if collection not built
     */
    function getQuestionMark() {
        // if _groups initialized (not null)
        if (this._groups) {
            if (!this.hasMatch()) {
                this._questionMark = [];
            }
            else {
                // if _questionsMark is not already built
                if (!Array.isArray(this._questionMark)) {
                    this._questionMark = this._groups.filter(function findQuestionMark(g) {
                        return (g.type === 'wildcard' && g.pattern === '?');
                    });
                }
            }
            return this._questionMark;
        }
        else {
            return null;
        }
    }

    const captureGroupsCollection = Object.assign({
        _regexWithCapture: null,
        _regexCaptureGroupArray: null,
        _groups: null,          // array of all groups
        _asterisk: null,        // array of groups for * wildcard
        _questionMark: null,    // array of groups for ? wildcard
    }, groupsCollectionInterface);
    captureGroupsCollection.initGroups = initGroups;
    captureGroupsCollection.buildGroups = buildGroups;
    captureGroupsCollection.getGroups = getGroups;
    captureGroupsCollection.hasMatch = hasMatch;
    captureGroupsCollection.getAsterisk = getAsterisk;
    captureGroupsCollection.getQuestionMark = getQuestionMark;

    return captureGroupsCollection;
}

module.exports.capture = capture;
module.exports.deconstruct = deconstruct;
