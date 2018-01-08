'use strict';
// const globule = require('globule');
const fs = require('fs');

function createMover() {
    return {
        commit: commit
    };

    /**
     * Returns as soon as error encountered.
     * @param filesList {String[]} List of files to rename
     * @param newFilesList {String[]} List of new names
     * @param [options] {Object} For future use
     * @param [callback] {Function} Function to be invoked after each rename attempt; callback arguments: error, oldName, newName, index.
     * @return {Number[]} Index of names for which rename succeeded;
     * @throws {Error} An Error object
     */
    function commit(filesList, newFilesList, options, callback) {
        let successIndexes = [];
        if (!Array.isArray(filesList) || !Array.isArray(newFilesList)) {
            throw new TypeError('Expects arrays of old and new names.');
        }

        filesList.forEach(function renameFile(oldName, idx) {
            let error = null;
            let newName = '';
            try {
                // Removing the trailing path sep '/' to work around the inconsistent behavior from renameSync with new filename that ends with '/'
                // Indeed, renameSync would complain that the file or folder does not exist for the following:
                // renameSync("test-data/bob", "test-data2/"), where test-data2 does not exist.
                // However, if the foldder "test-data2" does exist, then renameSync would complaint about illegal operation on a directory
                // Therefore, by removing the trailing '/', that would at least allow the renaming to "test-data2" if it does not already exist.
                newName = newFilesList[idx].endsWith('/') ? newFilesList[idx].slice(0, -1) : newFilesList[idx];
                if (!fs.existsSync(newName)) {
                    fs.renameSync(oldName, newName);
                    successIndexes.push(idx);
                }
                else {
                    error = new Error(`Skipping rename of '${oldName}': '${newName}' already exists.`);
                }
            }
            catch (e) {
                error = new Error('Failed rename commit. ' + e.message);
            }

            if (typeof callback === 'function') {
                callback(error, oldName, newName, idx);
            }
        });

        return successIndexes;
    }
}

module.exports.create = createMover;
