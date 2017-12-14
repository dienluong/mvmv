'use strict';

const DefaultParser = require('../src/mv-parser');
const DefaultRenamer = require('../src/mv-renamer');
const DefaultMover  = require('../src/mv-mover');

module.exports.create = function createMv() {
    let _parser = null;
    let _renamer = null;
    let _mover  = null;
    let _srcPattern = null;
    let _dstPattern = null;
    let _initialized = false;

    function init(p, r, m, src, dst) {
        _srcPattern = src || process.argv[2];
        _dstPattern = dst || process.argv[3];
        _parser = p || DefaultParser.create();
        _renamer = r || DefaultRenamer.create();
        _mover = m || DefaultMover.create();
        _initialized = true;
    }

    function run() {
        let filenames;
        let newFilenames;
        if (!_initialized) {
            throw new Error('Error: Object not initialized!');
        }
        filenames = _fetchFilenames(_srcPattern);
        newFilenames = _buildNewFilenames(filenames, _srcPattern, _dstPattern);
        _renameFiles(filenames, newFilenames);
    }

    function _fetchFilenames(glob) {
        return _parser.resolve(glob);
    }

    function _buildNewFilenames(filenames, srcGlob, dstGlob) {
        return _renamer.computeName(filenames, srcGlob, dstGlob);
    }

    function _renameFiles(oldFilenames, newFilenames) {
        _mover.commit(oldFilenames, newFilenames);
    }

    return {
        run: run,
        init: init
    };
};
