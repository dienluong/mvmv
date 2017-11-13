'use strict';
// const globule = require('globule');
// const rename    = require('../src/mv-renamer').rename;
const fs        = require('fs');

function createMover() {
    "use strict";
    return {
        commit: commit
    };

    /**
     * Returns as soon as error encountered.
     * @param filesList {String[]} List of files to rename
     * @param newFilesList {String[]} List of new names
     * @param [location] {String} Path of the source files on filesystem
     * @return {Number[]} Index of names for which rename failed;
     */
    function commit(filesList, newFilesList, location) {
        let failedIndexes = [];
        if (!Array.isArray(filesList) || !Array.isArray(newFilesList)) {
            throw new TypeError('Expects arrays of old and new names');
        }

        if (!location && (typeof location === 'string')) {
            if (fs.existsSync(location)) {
                // TODO: Add support for location argument?
            }
        }

        filesList.forEach(function renameFile(oldname, idx) {
            try {
                console.log('Renaming: ' + `${oldname} to ${newFilesList[idx]}`);
                fs.renameSync(oldname, newFilesList[idx])
            }
            catch (e) {
                //TODO: return a Map where key=idx, value=error?
                console.log('Error while renaming: ' + e);
                failedIndexes.push(idx);
            }
        });

        return failedIndexes;
    }
}

module.exports.create = createMover;
