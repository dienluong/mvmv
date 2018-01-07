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
     * @return {String[]} List of new names. String is empty if new name could not be computed.
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

        // Deconstruct the source glob into literal and wildcard parts
        let srcGlobParts = englobbed.deconstruct(srcGlob, {collapse: true});
        if (!srcGlobParts.length) {
            throw new Error('Unexpected error while parsing glob.');
        }

        // Deconstruct the destination glob into literal and wildcard parts
        let dstGlobParts = englobbed.deconstruct(dstGlob, {collapse: false});
        if (!dstGlobParts.length) {
            throw new Error('Unexpected error while parsing glob.');
        }

        let srcWildcardsCount = countWildcards(srcGlobParts);
        let dstWildcardsCount = countWildcards(dstGlobParts);

        // Check if destination glob has more * and/or ? wildcards than source glob does...
        if ((dstWildcardsCount.stars > srcWildcardsCount.stars) || (dstWildcardsCount.questions > srcWildcardsCount.questions)) {
            throw new Error('Invalid glob pattern. Destination glob contains more wildcards than source. (** is treated as * in source glob.)');
        }

        // extract matches for each wildcard (and literal) parts of the source glob
        let srcCaptureGroupsArray = englobbed.capture(names, srcGlob);
        if (!srcCaptureGroupsArray) {
            throw new Error('Unexpected error while extracting glob matches.');
        }

        let computedNames = names.map(function buildNewName(name, nameIdx) {
            // if source glob can't match the name, then can't construct new name
            if (!srcCaptureGroupsArray[nameIdx].hasMatch()) {
                return '';
            }

            let newName = '';
            let srcAsteriskList = srcCaptureGroupsArray[nameIdx].getAsterisk();
            let srcAsteriskIterator = srcAsteriskList && srcAsteriskList.length ? srcAsteriskList.entries() : null;
            let srcQuestionMarkList = srcCaptureGroupsArray[nameIdx].getQuestionMark();
            let srcQuestionMarkIterator = srcQuestionMarkList && srcQuestionMarkList.length ? srcQuestionMarkList.entries() : null;

            for (const destPart of dstGlobParts) {
                let srcGroup;
                switch (destPart) {
                    case '*':
                        srcGroup = srcAsteriskIterator.next();
                        // value[0] is the key, value[1] is the value, e.g. the actual captureGroup object.
                        // Append the * match to the new name construction
                        newName = newName + srcGroup.value[1].match;
                        break;
                    case '?':
                        srcGroup = srcQuestionMarkIterator.next();
                        // value[0] is the key, value[1] is the value, e.g. the actual captureGroup object.
                        // Appends the ? match to the new name construction
                        newName = newName + srcGroup.value[1].match;
                        break;
                    default: // For literal parts, simply append them to new name construction
                        newName = newName + destPart;
                }
            }
            return newName;
        });

        return computedNames;
    }

    /**
     * Returns the count of * and ? wildcards found in an array of strings.
     * @param arr {String[]} The array to search
     * @return {Object} stars: number of * ; questions: number of ?
     */
    function countWildcards(arr) {
        let numStars = arr.filter((str) => str === '*').length;
        let numQuestions = arr.filter((str) => str === '?').length;

        return {
            stars : numStars,
            questions: numQuestions
        };
    }
}

module.exports.create = createRenamer;
