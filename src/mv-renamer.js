'use strict';
const englobbed     = require('./en-globbed');

function createRenamer() {
    /**
     * Builds new names based on provided glob patterns.
     * @param names {String[] | string} List of original names, or a single name (string), to compute new names for
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

        let srcWildcardsCount = _countWildcards(srcGlobParts);
        let dstWildcardsCount = _countWildcards(dstGlobParts);

        // Check if destination glob has more * and/or ? wildcards than source glob does...
        if ((dstWildcardsCount.stars > srcWildcardsCount.stars) || (dstWildcardsCount.questions > srcWildcardsCount.questions)) {
            throw new Error('Invalid glob pattern. Destination glob contains incorrect number or type of wildcard. (** is treated as * in source glob.)');
        }

        // extract matches for each wildcard (and literal) parts of the source glob
        let srcCaptureGroupsArray = englobbed.capture(names, srcGlob);
        if (!srcCaptureGroupsArray) {
            throw new Error('Unexpected error while extracting glob matches.');
        }

        let computedNames = names.map(function buildNewName(name, nameIdx) {
            // The source glob is required to match the original name in order to proceed building the new name
            if (!srcCaptureGroupsArray[nameIdx].hasMatch()) {
                return '';
            }

            let newName = '';
            let srcAsteriskList = srcCaptureGroupsArray[nameIdx].getAsterisk();
            let srcAsteriskIterator = srcAsteriskList && srcAsteriskList.length ? srcAsteriskList.entries() : null;
            let srcQuestionMarkList = srcCaptureGroupsArray[nameIdx].getQuestionMark();
            let srcQuestionMarkIterator = srcQuestionMarkList && srcQuestionMarkList.length ? srcQuestionMarkList.entries() : null;

            // Cycle through the parts of the destination glob to build the new name
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
     * Returns the number of elements representing * and ? wildcards.
     * @private
     * @param arr {String[]} The array to search
     * @returns {Object} stars: number of * ; questions: number of ?
     */
    function _countWildcards(arr) {
        let numStars = arr.filter((str) => str === '*').length;
        let numQuestions = arr.filter((str) => str === '?').length;

        return Object.freeze({
            stars : numStars,
            questions: numQuestions
        });
    }

    return {
        computeName: computeName
    };
}

module.exports.create = createRenamer;
