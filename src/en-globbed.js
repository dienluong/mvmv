'use strict';

const globGroupsCollectionInterface = require('./globGroupsCollectionInterface');

/**
 * The module determines the match of each part of the provided glob, applied to each element of the list of strings ("names").
 * @module en-globbed
 */


/**
 * For each string in names array, return a globGroupsCollection (an object implementing globGroupsCollectionInterface) containing the substring matched by each part of the glob pattern.
 * Example of parts of a glob: "?omer.*" => Parts: ["?"] ["omer."] ["*"]
 * @method capture
 * @param names {String[]} List of names
 * @param glob {String} The glob pattern to be applied to names
 * @return {globGroupsCollection[] | null} An array of globGroupsCollection objects. Returns null if invalid parameters or names list is empty.
 */
function capture(names, glob) {
    if (!Array.isArray(names) || !names.length) {
        return null;
    }

    if ((typeof glob !== 'string') || !glob) {
        return null;
    }

    // For each name received, create an object of type 'globGroupsCollection' containing the match for each part of the glob
    return names.map(function buildGlobGroupsCollection(name) {
        let groupsObj = _globGroupsCollectionFactory();
        groupsObj.initGroups(glob);
        groupsObj.buildGroups(name);
        return groupsObj;
    });
}


/**
 * Returns the different parts (literals, wildcards) of a glob pattern.
 * @method deconstruct
 * @param glob {String} Glob pattern to extract the parts from
 * @param [options] {Object} options.collapse: whether consecutive * in glob pattern should collapse into a single *;
 *                                             default is false.
 * @return {String[]} The parts of the glob; empty array if glob is invalid (e.g. empty string)
 *                    Example: For glob 'abc*def' -> [ 'abc', '*', 'def' ]
 */
function deconstruct(glob, options) {
    let groups = [];
    let marker;
    // if not a string or empty string, return empty array
    if (typeof glob !== 'string' || !glob) {
        return [];
    }

    if (options && options.collapse) {
        // Any multiple consecutive * is equivalent to a single *
        glob = glob.replace(/\*{2,}/g,'*');
    }

    marker = glob.search(/[*|?]/g);
    while (marker !== -1) {
        // If marker is not at first position, everything before the marker is a group
        // Example: abc*def -> groups [abc][*][def]
        if (marker !== 0) {
            groups.push(glob.slice(0, marker));
        }
        // character at marker position is a group on its own
        groups.push(glob.charAt(marker));
        // Truncate the portion already processed and continue with the remainder
        glob = glob.substr(marker+1);
        marker = glob.search(/[*|?]/g);
    }

    // Push remaining part of the glob, if not empty
    if (glob) {
        groups.push(glob);
    }

    return groups;
}

/**
 * Perform regex character escaping on provided string.
 * @private
 * @param glob {String} String to escape
 * @return {String} String with characters properly escaped for regex.
 */
function _escapeRegexChars(glob) {
    // Note: '\' must not be escaped because it's already escaped within the glob pattern.
    return glob.replace(/[-[\]{}()+.\/^$|]/g, '\\$&');
}

/**
 * Convert glob into regex with capture groups.
 * Example: abc?123.*DEF --> /(abc)(.)(123\.)(.*)(DEF)/
 * @private
 * @param glob {String} The glob pattern to convert
 * @return {RegExp} Regular expression with capture groups added to the various parts
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
                    p = _escapeRegexChars(p);
                    return `(${p})`;
            }
        }
        else {
            return '';
        }
    });

    // Add regex anchors
    partsWithCaptureGroups.unshift('^');
    partsWithCaptureGroups.push('$');

    return new RegExp(partsWithCaptureGroups.join(''));
}


/**
 * Initializes the globGroupsCollection.
 * @method initGroups
 * @param glob {String} Glob pattern
 * @param [text] {String} The text to attempt to match with the glob pattern.
 * @return {Boolean} true: init completed; false: init aborted
 */
function initGroups(glob, text) {
    if (this._groups) {
        // Do nothing if groups already built
        // Allowing initialization after groups have already been built would risk making
        // the internally saved regex and glob inconsistent with the groups' stored content.
        return false;
    }

    if (typeof glob !== 'string') {
        return false;
    }

    this._groups = null;          // array of 'match' objects (see method buildGroups) for all groups of the glob
    this._asterisk = null;        // array of 'match' objects for groups representing * wildcard in the glob
    this._questionMark = null;    // array of 'match' objects for groups representing ? wildcard in the glob
    // Transform glob pattern to equivalent regex
    this._regexWithCapture = _convertToRegExWithCaptureGroups(glob);
    // Produce an array of all parts of the glob pattern
    this._globPartsArray = deconstruct(glob, {collapse: true});

    if (text) {
        this.buildGroups(text);
    }

    return true;
}


/**
 * Builds an array of objects for each group (or parts) of the glob pattern.
 * @method buildGroups
 * @param text {String} The text to attempt to match with the glob pattern.
 * @param [glob] {String} Glob pattern
 * @return {Object[]} - If the glob matches the given text, then each element of the array is a 'match' object
 *                      corresponding to each part of the glob pattern.
 *                      Example with glob 'h*':
 *                              match object #1: {type: 'literal', pattern: 'h', match: 'h'}
 *                              match object #2: {type: 'wildcard', pattern: '*', match: 'omer.js'}
 *                 - If there is no match, then array is empty;
 *                 - If there's an error, array contains an Error object.
 */
function buildGroups(text, glob) {
    if (typeof text !== 'string') {
        this._groups = [ new TypeError('Invalid type! Expects a string.') ];
        return this._groups;
    }

    if (glob) {
        this.initGroups(glob);
    }

    if (!Array.isArray(this._globPartsArray) || !this._regexWithCapture) {
        this._groups = [ new Error('Build failed! Object not initialized.') ];
        return this._groups;
    }

    let matches = text.match(this._regexWithCapture);
    if (!matches) {
        this._groups = [];
        return this._groups;
    }

    // String.match() returns the entire match *and* the capture group matches;
    // so its array length must necessarily be > than the length of the glob parts array;
    // otherwise, we have something wrong and won't be able to proceed building the groups.
    if (matches.length <= this._globPartsArray.length) {
        this._groups = [ new Error(`Error: length mismatch! matches: ${matches.length}, groups: ${this._globPartsArray.length}`) ];
        return this._groups;
    }

    // Resets properties
    this._groups = [];
    this._questionMark = null;
    this._asterisk = null;

    // Build the groups, i.e. an array of 'match' objects.
    this._globPartsArray.forEach(function (g, idx) {
        // Use matches[idx + 1] because whole match is at index 0 of the array of matches
        if (g === '?' || g === '*') {
            this._groups.push(Object.freeze({
                type: "wildcard",
                pattern: g,
                match: matches[idx + 1]
            }));
        }
        else {
            this._groups.push(Object.freeze({
                type: "literal",
                pattern: g,
                match: matches[idx + 1]
            }));
        }
    }, this);

    return this._groups;
}


/**
 * Whether the glob matches the text
 * @method hasMatch
 * @return {boolean}
 */
function hasMatch() {
    return (Array.isArray(this._groups) && (this._groups.length !== 0) && !(this._groups[0] instanceof Error));
}


/**
 * @method getGroups
 * @return {Object[] | null} Array of match object for each part of the glob pattern; empty if no match; null if collection not built.
 *                           Example of match object: {type: 'literal', pattern: 'h', match: 'h'}
 */
function getGroups() {
    return this._groups;
}


/**
 * @method getAsterisk
 * @return {Object[] | null} Array of match object for each wildcard '*' of the glob; empty if no match; null if collection not built.
 *                           Example of match object: {type: 'wildcard', pattern: '*', match: 'txt'}
 */
function getAsterisk() {
    // if _groups initialized (not null)
    if (this._groups !== null) {
        // if _asterisk not already built, then build it
        if (!Array.isArray(this._asterisk)) {
            if (!this.hasMatch()) {
                this._asterisk = [];
            }
            else {
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
 * @method getQuestionMark
 * @return {Object[] | null} Array of match object for each wildcard '?' of the glob; empty if no match; null if collection not built.
 *                           Example of match object: {type: 'wildcard', pattern: '?', match: 'd'}
 */
function getQuestionMark() {
    // if _groups initialized (not null)
    if (this._groups !== null) {
        // if _questionMark not already built, then built it
        if (!Array.isArray(this._questionMark)) {
            if (!this.hasMatch()) {
                this._questionMark = [];
            }
            else {
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


// An object implementing the globGroupsCollection interface
const globGroupsCollection      = Object.create(globGroupsCollectionInterface);
globGroupsCollection.initGroups = initGroups;
globGroupsCollection.buildGroups = buildGroups;
globGroupsCollection.hasMatch    = hasMatch;
globGroupsCollection.getGroups   = getGroups;
globGroupsCollection.getAsterisk = getAsterisk;
globGroupsCollection.getQuestionMark = getQuestionMark;

/**
 * Returns a globGroupsCollection object.
 * @method _globGroupsCollectionFactory
 * @private
 * @return {globGroupsCollection} Object implementing the globGroupsCollection interface.
 */
function _globGroupsCollectionFactory() {
    return Object.create(globGroupsCollection);
}

module.exports.capture = capture;
module.exports.deconstruct = deconstruct;
