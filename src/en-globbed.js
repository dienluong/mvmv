'use strict';

const glToRe  = require('glob-to-regexp');
const globGroupsCollection = require('../src/globGroupsCollectionInterface');

/**
 * The module determines the match of each part of the provided glob, applied to each element of the list of names.
 * @module englobbed
 */

/**
 * For each element in names array, return a globGroupsCollection (an object implementing the globGroupsCollectionInterface) containing the match of each parts of the glob pattern.
 * Example of parts of a glob: "?omer.*" => Parts: #1 '?', #2 'omer.', #3 '*'
 * @method capture
 * @param names {String[]} List of names
 * @param glob {String} The glob pattern to be applied to names
 * @return {globGroupsCollection[]} An array of globGroupsCollection objects. Returns null if invalid parameters or names list is empty.
 */
function capture(names, glob) {
    if (!Array.isArray(names) || !names.length) {
        return null;
    }

    if ((typeof glob !== 'string') || !glob) {
        return null;
    }

    // For each names received, return an object of type 'globGroupsCollection' containing the match for each part of the glob
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
 *                  Example: For glob 'abc*def' -> [ 'abc', '*', 'def' ]
 */
function deconstruct(glob, options) {
    let groups = [];
    let marker;
    let subGlob = glob;
    // if not a string or empty string, return empty array
    if (typeof glob !== 'string' || !glob) {
        return [];
    }

    if (options && options.collapse) {
        // Any multiple consecutive * is equivalent to a single *
        subGlob = glob.replace(/\*{2,}/g,'*');
    }

    marker = subGlob.search(/[*|?]/g);
    while (marker !== -1) {
        // If marker is not at first spot, everything before the marker is a group
        // Example: abc*def -> groups [abc][*][def]
        if (marker !== 0) {
            groups.push(subGlob.slice(0, marker));
        }
        // character at marker is itself a group on its own
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
 * Convert glob into regex with capture groups.
 * Example: abc?123.*DEF --> /(abc)(.)(123\.)(.*)(DEF)/
 * @method _convertToRegExWithCaptureGroups
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
                    // Work around a bug with glob-to-regexp.
                    // The bug: a glob pattern bob\\pete, which matches bob\pete, would be converted to /^bob\\\\pete$/ which matches bob\\pete.
                    p = p.replace(/\\{2}/g, '\\');
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
 * Returns a globGroupsCollection object.
 * @method _globGroupsCollectionFactory
 * @private
 * @return {globGroupsCollection} Object implementing the globGroupsCollection interface.
 */
function _globGroupsCollectionFactory() {
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
            // Allowing initialization when groups already built would risk making
            // the internally saved regex and glob become unrelated to the group's actual content.
            return false;
        }

        if (typeof glob !== 'string') {
            return false;
        }

        this._groups = null;          // array of all groups
        this._asterisk = null;        // array of groups for * wildcard
        this._questionMark = null;    // array of groups for ? wildcard
        // Transform glob pattern to equivalent regex
        this._regexWithCapture = _convertToRegExWithCaptureGroups(glob);
        // Produce an array of all groups from the glob pattern
        this._globGroupArray = deconstruct(glob, {collapse: true});

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
     * @return {Object[]} - If the glob matches the given text, then each element of the array is an object
     *                          for each part of the glob pattern; Example for glob 'h*':
     *                              {type: 'literal', pattern: 'h', match: 'h'}
     *                              {type: 'wildcard', pattern: '*', match: 'omer.js'}
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

        if (!Array.isArray(this._globGroupArray) || !this._regexWithCapture) {
            this._groups = [ new Error('Build failed! Object not initialized.') ];
            return this._groups;
        }

        let matches = text.match(this._regexWithCapture);
        if (!matches) {
            this._groups = [];
            return this._groups;
        }

        // String.match() returns the entire match *and* the capture group matches;
        // so its array length must be > then the length of the capture groups array
        if (matches.length <= this._globGroupArray.length) {
            this._groups = [ new Error(`Error: length mismatch! matches: ${matches.length}, groups: ${this._globGroupArray.length}`) ];
            return this._groups;
        }

        // Resets properties
        this._groups = [];
        this._questionMark = null;
        this._asterisk = null;

        this._globGroupArray.forEach(function (g, idx) {
            // matches[idx + 1] because whole match is at index 0 of the array of matches
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
        return (this._groups !== null && this._groups.length !== 0 && !(this._groups[0] instanceof Error));
    }

    /**
     * @method getGroups
     * @return {Object[] | null} Array containing a match object for each group of the glob pattern; empty if no match; null if collection not built.
     */
    function getGroups() {
        return this._groups;
    }

    /**
     * @method getAsterisk
     * @return {Object[] | null} Array containing a match object for each wildcard '*' capture group; empty if no match; null if collection not built.
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
     * @method getQuestionMark
     * @return {Object[] | null} Array containing a match object for each wildcard '?' capture group; empty if no match; null if collection not built.
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

    globGroupsCollection.initGroups = initGroups;
    globGroupsCollection.buildGroups = buildGroups;
    globGroupsCollection.getGroups = getGroups;
    globGroupsCollection.getAsterisk = getAsterisk;
    globGroupsCollection.getQuestionMark = getQuestionMark;
    globGroupsCollection.hasMatch = hasMatch;

    return Object.create(globGroupsCollection);
}

module.exports.capture = capture;
module.exports.deconstruct = deconstruct;
