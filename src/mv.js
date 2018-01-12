'use strict';

const DefaultParser = require('../src/mv-parser');
const DefaultRenamer = require('../src/mv-renamer');
const DefaultMover  = require('../src/mv-mover');

/**
 * Creates a Mv object that renames files on file system using glob patterns.
 * @param [parser] {Object} Object with a resolve(glob) method where:
 *                                  'glob' is a string.
 * @param [renamer] {Object} Object with a computeName(names, srcGlob, dstGlob) method where:
 *                                  'names': array of strings
 *                                  'srcGlob': string
 *                                  'dstGlob': string
 * @param [mover] {Object} Object with a commit(oldNames, newNames, callback) method where:
 *                                  'oldNames': array of strings
 *                                  'newNames': array of strings
 *                                  'callback': function
 * @return {Object} An Mv object
 */
function createMv(parser, renamer, mover) {
    let _parser     = null;
    let _renamer    = null;
    let _mover      = null;

    function _fetchFilenames(glob) {
        return _parser.resolve(glob);
    }

    function _buildNewFilenames(filenames, srcGlob, dstGlob) {
        return _renamer.computeName(filenames, srcGlob, dstGlob);
    }

    function _renameFiles(oldFilenames, newFilenames, callback) {
        callback = typeof callback === 'function' ? callback : null;
        return _mover.commit(oldFilenames, newFilenames, null, callback);
    }

    function init(p, r, m) {
        _parser = p || _parser;
        _renamer = r || _renamer;
        _mover = m || _mover;
    }

    /**
     * Performs files rename on file system.
     * @param src {String} Glob pattern specifying files to rename
     * @param dst {String} Glob pattern characterizing the new names
     * @param [cb] {Function} Function to be invoked after each rename attempt; callback arguments: error, oldName, newName.
     * @return {Number | null} Number of successful renames. null if no source file found.
     * @throws {Error} An Error object
     */
    function exec(src, dst, cb) {
        let filenames = [];
        let newFilenames = [];
        let successList = [];
        let returnVal;

        if (typeof src !== 'string' || typeof dst !== 'string' || !src.length || !dst.length) {
            throw new TypeError("Invalid arguments. Glob patterns must be non-empty strings.");
        }

        // Normalize the path separators:
        // 1. If on Windows, then convert Windows path separators to posix separator
        //    This is required for consistency because the glob module we rely on always uses posix separator.
        // 2. Collapse multiple '/' into a single one.
        const srcPattern = process.platform === 'win32' ? src.replace(/\\/g, '/').replace(/\/+/g, '/') : src.replace(/\/+/g, '/');
        const dstPattern = process.platform === 'win32' ? dst.replace(/\\/g, '/').replace(/\/+/g, '/') : dst.replace(/\/+/g, '/');

        filenames = _fetchFilenames(srcPattern);
        if (filenames.length) {
            newFilenames = _buildNewFilenames(filenames, srcPattern, dstPattern);
            successList = _renameFiles(filenames, newFilenames, cb);
            returnVal = successList.length;
        }
        else {
            returnVal = null;
        }

        return returnVal;
    }

    _parser = parser || DefaultParser.create();
    _renamer = renamer || DefaultRenamer.create();
    _mover = mover || DefaultMover.create();

    return {
        exec: exec,
        init: init
    };
}

module.exports.create = createMv;
