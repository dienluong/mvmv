'use strict';

const DefaultParser = require('./mv-parser');
const DefaultRenamer = require('./mv-renamer');
const DefaultMover  = require('./mv-mover');

/**
 * Creates a mv-controller object that moves files on file system using glob patterns.
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
 * @return {Object} A mv-controller object
 */
function createController(parser, renamer, mover) {
    let _parser     = null;
    let _renamer    = null;
    let _mover      = null;

    function _fetchFilenames(glob) {
        return _parser.resolve(glob);
    }

    function _buildNewFilenames(filenames, srcGlob, dstGlob) {
        return _renamer.computeName(filenames, srcGlob, dstGlob);
    }

    function _moveFiles(oldFilenames, newFilenames, callback) {
        callback = typeof callback === 'function' ? callback : null;
        return _mover.commit(oldFilenames, newFilenames, null, callback);
    }

    /**
     * Injects parser, renamer and mover objects into the mv-controller object.
     * @method init
     * @param p {Object} parser
     * @param r {Object} renamer
     * @param m {Object} mover
     */
    function init(p, r, m) {
        _parser = p || _parser;
        _renamer = r || _renamer;
        _mover = m || _mover;
    }

    /**
     * Moves files on file system.
     * @method exec
     * @param src {String} Glob pattern specifying files to move
     * @param dst {String} Glob pattern characterizing the new names
     * @param [cb] {Function} Function to be invoked after each move attempt; callback arguments: error, oldName, newName, index.
     * @return {Number | null} Number of successful move operations. Null if no source file found.
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
        let srcPattern = (process.platform === 'win32') ? src.replace(/\\/g, '/').replace(/\/+/g, '/') : src.replace(/\/+/g, '/');
        let dstPattern = (process.platform === 'win32') ? dst.replace(/\\/g, '/').replace(/\/+/g, '/') : dst.replace(/\/+/g, '/');

        // Removing trailing '/' to work around an inconsistency with fs.renameSync(), which is used in mv-mover module.
        // On Windows, renaming to 'filename.ext/' would succeed and filename.ext (without trailing '/') would be created.
        // On MacOS, such operation would fail with an Error: ENOENT: no such file or directory
        dstPattern = dstPattern.endsWith('/') ? dstPattern.slice(0, -1) : dstPattern;

        filenames = _fetchFilenames(srcPattern);
        if (filenames.length) {
            newFilenames = _buildNewFilenames(filenames, srcPattern, dstPattern);
            successList = _moveFiles(filenames, newFilenames, cb);
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

module.exports.create = createController;
