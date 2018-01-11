'use strict';
// const globule = require('globule');
const fs = require('fs');

function createMover() {
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
                newName = newFilesList[idx];
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

    return {
        commit: commit
    };
}

module.exports.create = createMover;
