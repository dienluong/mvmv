'use strict';
const englobbed     = require('../src/en-globbed');

/**
 *
 * @param names {Array} List of original names to rename
 * @param srcGlob {String} Glob pattern used to match the original names
 * @param dstGlob {String} Glob pattern used to contruct new names
 * @return {Array} List of new names
 */
function rename(names, srcGlob, dstGlob) {
    // extract matches for each wildcar (and literal) part of the glob
    let captureGroupsList = englobbed.capture(names, srcGlob);
    // Deconstruct the glob into literal and wildcar parts
    let dstGlobParts = englobbed.deconstruct(dstGlob);
    let rank = 0;
    let newNames = dstGlobParts.forEach(function constructName(part, idx, arr) {
        //TODO: to be continued...
        if (part === '*') {
            rank += 1;
        }
    });
    return newNames;
}

// function constructName(namesList, newNamePattern) {
//     let newNames = [];

    // let globGroups = englobbed.group(newNamePattern);
    //
    // return newNames;
// }

module.exports.rename = rename;
