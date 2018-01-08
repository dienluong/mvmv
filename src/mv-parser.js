'use strict';

//http://stackoverflow.com/a/25580289
const glob = require('glob');

function createParser () {
    const options = {
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
         * @returns {String[]} Files/paths matching the provided pattern
         * @throws {Error} An Error object
         */
        resolve: function (pattern) {
            if (typeof pattern !== 'string') {
                throw new TypeError('Glob pattern must be a string.');
            }

            if (process.platform === 'win32') {
                pattern = pattern.replace(/\\/g, '/');
            }

            //returns array of filenames (string) matching the pattern, or empty array if no match
            let results = glob.sync(pattern, options);
            return results;
        }
    };
}

module.exports.create = createParser;
