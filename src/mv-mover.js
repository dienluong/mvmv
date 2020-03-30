'use strict';
const fs = require('fs');

function createMover() {
    /**
     * Moves a list of files based on list of new names. Returns as soon as error encountered.
     * @param filesList {String[]} List of files to move
     * @param newFilesList {String[]} List of new names
     * @param [options] {Object} For future use
     * @param [callback] {Function} Function to be invoked after each move attempt; callback arguments: error, oldName, newName, index.
     * @return {Number[]} Index of names for which move succeeded;
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
                    error = new Error(`Skipping '${oldName}': '${newName}' already exists.`);
                }
            }
            catch (e) {
                error = new Error('Failed move commit. ' + e.message);
            }

            if (typeof callback === 'function') {
                callback(error, oldName, newName, idx);
            }
        });

        return successIndexes;
    }

    /**
     * An async version of commit(). Moves a list of files based on list of new names. Returns a Promise.
     * Promise resolves to the number of successful file moves if all moves have been successful;
     * For any error, the Promise rejects to an array containing an Error on the position corresponding to the file that failed to be moved.
     * @param filesList {String[]} List of files to move
     * @param newFilesList {String[]} List of new names
     * @param [options] {Object} For future use
     * @return { Promise }
     */
    function commitAsync(filesList, newFilesList, options) {
        let failedIndexes = [];
        if (!Array.isArray(filesList) || !Array.isArray(newFilesList)) {
            return Promise.reject([new TypeError('Expects arrays of old and new names.')])
        }

        return new Promise((resolve, reject) => {
            filesList.forEach(function renameFile(oldName, idx) {
                let error = null;
                let newName = '';
                try {
                    newName = newFilesList[idx];
                    if (!fs.existsSync(newName)) {
                        fs.renameSync(oldName, newName);
                        error = null;
                    }
                    else {
                        error = new Error(`Skipping '${oldName}': '${newName}' already exists.`);
                    }
                }
                catch (e) {
                    error = new Error('Failed move commit. ' + e.message);
                }
                failedIndexes[idx] = error;
            });

            if (failedIndexes.every(e => e === null)) {
                resolve(failedIndexes.length);
            } else {
                reject(failedIndexes);
            }
        });
    }

    return {
        commit,
        commitAsync,
    };
}

module.exports.create = createMover;
