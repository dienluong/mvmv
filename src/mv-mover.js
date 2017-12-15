'use strict';
// const globule = require('globule');
const fs        = require('fs');

function createMover() {
    return {
        commit: commit
    };

    /**
     * Returns as soon as error encountered.
     * @param filesList {String[]} List of files to rename
     * @param newFilesList {String[]} List of new names
     * @param [location] {String} Path of the source files on filesystem
     * @param [callback] {Function} Function to be invoked after each rename attempt; callback arguments: error, oldName, newName, index.
     * @return {Number[]} Index of names for which rename failed;
     * @throws {Error} An Error object
     */
    function commit(filesList, newFilesList, location, callback) {
        let failedIndexes = [];
        if (!Array.isArray(filesList) || !Array.isArray(newFilesList)) {
            throw new TypeError('Expects arrays of old and new names.');
        }

        if (location && (typeof location === 'string')) {
            if (fs.existsSync(location)) {
                // TODO: Add support for location argument?
            }
        }

        filesList.forEach(function renameFile(oldName, idx) {
            let error = null;
            let newName = '';
            try {
                newName = newFilesList[idx];
                fs.renameSync(oldName, newName);
                // console.log('Renaming: ' + `${oldName} to ${newName}`);
            }
            catch (e) {
                //TODO: return a Map where key=idx, value=error?
                failedIndexes.push(idx);
                error = new Error('Failed rename commit. ' + e.message);
            }

            if (typeof callback === 'function') {
                callback(error, oldName, newName, idx);
            }
        });

        return failedIndexes;
    }
}

module.exports.create = createMover;
