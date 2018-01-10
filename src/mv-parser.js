'use strict';

//http://stackoverflow.com/a/25580289
const glob = require('glob');

function createParser () {
    const defaultOptions = {
        nobrace: true,
        noglobstar: true,
        noext: true,
        nodir: true
    };

    return {
        /**
         * Returns a list of files/paths in the file system, matching the glob pattern.
         * @method resolve
         * @param pattern {String} glob pattern
         * @param options {Object} globbing options
         * @returns {String[]} Files/paths matching the provided pattern
         * @throws {Error} An Error object
         */
        resolve: function (pattern, options) {
            if (typeof pattern !== 'string') {
                throw new TypeError('Glob pattern must be a string.');
            }

            if (!options || typeof options !== 'object') {
                options = defaultOptions;
            }

            //returns array of filenames (string) matching the pattern, or empty array if no match
            let results = glob.sync(pattern, options);
            return results;
        }
    };
}

module.exports.create = createParser;
