'use strict';

const glob = require('glob');

function createParser () {
    const _defaultOptions = {
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
         * @returns {String[]} Files matching the provided pattern
         * @throws {Error} An Error object
         */
        resolve: function (pattern, options) {
            if (typeof pattern !== 'string') {
                throw new TypeError('Glob pattern must be a string.');
            }

            if (!options || typeof options !== 'object') {
                options = _defaultOptions;
            }

            //returns array of filenames (string) matching the pattern, or empty array if no match
            return glob.sync(pattern, options);
        }
    };
}

module.exports.create = createParser;
