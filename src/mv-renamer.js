'use strict';
const englobbed     = require('../src/en-globbed');

function createRenamer() {
    return {
        computeName: computeName
    };

    /**
     * Builds new names based on provided glob patterns.
     * @param names {String[] | string} List of original names to compute new names for, or a single name (string)
     * @param srcGlob {String} Glob pattern used to match the original names
     * @param dstGlob {String} Glob pattern used to contruct new names
     * @return {String[]} List of new names
     * @throws {Error} An Error object
     */
    function computeName(names, srcGlob, dstGlob) {
        if ((typeof srcGlob !== 'string' || !srcGlob) || (typeof dstGlob !== 'string' || !dstGlob)) {
            throw new TypeError('Invalid type for glob pattern! Must be a non-empty string.');
        }
        if (typeof names === 'string') {
            names = [names];
        }
        else {
            if (Array.isArray(names)) {
                if (!names.length) {
                    throw new TypeError('Invalid names list. Array must be non-empty.');
                }
            } // names is not an array, nor a string
            else {
                throw new TypeError('Invalid type for names! Must be a string or an Array of string.');
            }
        }

        // extract matches for each wildcard (and literal) parts of the glob
        let srcCaptureGroupsArray = englobbed.capture(names, srcGlob);
        if (!srcCaptureGroupsArray) {
            throw new Error('Unexpected error while extracting glob matches.');
        }

        // Deconstruct the glob into literal and wildcard parts
        let dstGlobParts = englobbed.deconstruct(dstGlob, {collapse: false});
        if (!dstGlobParts.length) {
            throw new Error('Unexpected error while parsing glob.');
        }

        let newNames = names.map(function buildNewName(name, iName) {
            // if source glob can't match the name, then can't construct new name
            if (!srcCaptureGroupsArray[iName].hasMatch()) {
                return '';
            }

            let newName = '';
            let srcAsteriskList = srcCaptureGroupsArray[iName].getAsterisk();
            let srcAsteriskIterator = srcAsteriskList && srcAsteriskList.length ? srcAsteriskList.entries() : null;
            let srcQuestionMarkList = srcCaptureGroupsArray[iName].getQuestionMark();
            let srcQuestionMarkIterator = srcQuestionMarkList && srcQuestionMarkList.length ? srcQuestionMarkList.entries() : null;

            let end = dstGlobParts.length;
            for (let iPart = 0; iPart < end; iPart += 1) {
                let destPart = dstGlobParts[iPart];
                switch (destPart) {
                    case '*':
                        // destination glob contains * but source glob has none
                        if (srcAsteriskIterator === null) {
                            return '';
                        }
                        else {
                            let srcGroup = srcAsteriskIterator.next();
                            // destination glob contains more * than source glob does
                            if (srcGroup.done) {
                                return '';
                            }
                            else {
                                // value[0] is the key, value[1] is the value, e.g. the actual captureGroup object.
                                newName = newName + srcGroup.value[1].match;
                            }
                        }
                        break;
                    case '?':
                        // destination glob contains ? but source glob has none
                        if (srcQuestionMarkIterator === null) {
                            return '';
                        }
                        else {
                            let srcGroup = srcQuestionMarkIterator.next();
                            // destination glob contains more ? than source glob does
                            if (srcGroup.done) {
                                return '';
                            }
                            else {
                                // value[0] is the key, value[1] is the value, e.g. the actual captureGroup object.
                                newName = newName + srcGroup.value[1].match;
                            }
                        }
                        break;
                    default: // For literal parts, simply append them to newName
                        newName = newName + destPart;
                }
            }
            return newName;
        });

        return newNames;
    }
}

module.exports.create = createRenamer;
