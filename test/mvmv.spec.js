'use strict';

let mvmv            = require('../src/mvmv');
let commander       = require('commander');
const readlineSync  = require('readline-sync');
const robot         = require('robotjs');

const path          = require('path').posix;
const fs            = require('fs');
const mockFs        = require('mock-fs');
const globby        = require('globby');
const FilenameGen   = require('natural-filename-generator');
const expect        = require('chai').expect;
const sinon         = require('sinon');
const TEST_PATH     = path.join('test', 'test-data');
const IS_WINOS      = process.platform === 'win32';

/**
 * Resets the 'commander' module by reloading both the mvmv module and 'commander' in this module.
 */
function reloadApp() {
    delete require.cache[ require.resolve('../src/mvmv') ];
    delete require.cache[ require.resolve('commander') ];
    mvmv        = require('../src/mvmv');
    commander   = require('commander');
}

function populateMockedFS(mockedSystem) {
    const g = new FilenameGen();
    const extensions = ['txt', 'TXT', 'jpeg', 'JPEG', 'js', 'JS'];
    // Add peculiar filenames
    const specialNames = [ '^onecaret.up^', '^^onecaret.up^', '^twocarets.hi^^', '^^twocarets.hi^^',
        '$onedollar.tm$', '$$onedollar.tm$', '$twodollars.js$$', '$$twodollars.js$$',
        'dotnames1.a.b', 'dotnames2.a.b', 'dotdotnames1.z..', 'dotdotnames2.z..'];
    let folderContent = {};

    // Build a Map tracking all files in the mock filesystem (created w/ mock-fs).
    // Key is the file extension and value is an array of the filenames with that extension
    // Also builds the object "folderContent" for mock-fs
    for (let i = extensions.length - 1; i >= 0; i -= 1) {
        const name1 = g.generate(extensions[i]);
        const name2 = g.generate(extensions[i]);
        Object.defineProperty(folderContent, name1, {
            enumerable: true,
            value: 'created by mock-fs'
        });
        Object.defineProperty(folderContent, name2, {
            enumerable: true,
            value: 'created by mock-fs'
        });
    }

    specialNames.forEach(function (name) {
        Object.defineProperty(folderContent, name, {
            enumerable: true,
            value: 'created by mock-fs'
        });
    });

    // creates mock test folder and files
    mockedSystem({
        'test/test-data' : folderContent,
        'test/test-data2': {}
    });
}

describe('mvmv', function () {
    describe('when arguments is not correct', function () {
        it('should display usage help info', function () {
            process.argv = [process.execPath, 'mvmv.js'];
            reloadApp();
            sinon.spy(commander, 'outputHelp');
            mvmv.run();
            expect(commander.outputHelp.called).to.be.true;
            commander.outputHelp.restore();

            process.argv = [process.execPath, 'mvmv.js', 'a.file'];
            reloadApp();
            sinon.spy(commander, 'outputHelp');
            mvmv.run();
            expect(commander.outputHelp.called).to.be.true;
            commander.outputHelp.restore();

            process.argv = [process.execPath, 'mvmv.js', '--verbose'];
            reloadApp();
            sinon.spy(commander, 'outputHelp');
            mvmv.run();
            expect(commander.outputHelp.called).to.be.true;
            commander.outputHelp.restore();

            process.argv = [process.execPath, 'mvmv.js', '--simulate', 'a.file'];
            reloadApp();
            sinon.spy(commander, 'outputHelp');
            mvmv.run();
            expect(commander.outputHelp.called).to.be.true;
            commander.outputHelp.restore();

            process.argv = [process.execPath, 'mvmv.js', '--interaktiv', path.join(TEST_PATH, '*.jpeg'), path.join(TEST_PATH, '*.jpg')];
            reloadApp();
            sinon.spy(commander, 'outputHelp');
            mvmv.run();
            expect(commander.outputHelp.called).to.be.true;
            commander.outputHelp.restore();

            reloadApp();
        });
    });

    describe('when receiving valid arguments', function () {
        it('should read the glob patterns from the command line', function () {
            let starGlob = path.join(TEST_PATH, '*');
            let allFiles = globby.sync(starGlob);
            let srcGlob = path.join(TEST_PATH, '*.txt');
            let dstGlob = path.join(TEST_PATH, '*TXT');
            expect(globby.sync(srcGlob).length).to.eql(2);
            expect(globby.sync(dstGlob).length).to.eql(2);

            // Simulate command: node mvmv.js <src> <dst>
            process.argv = [process.execPath, 'mvmv.js', srcGlob, dstGlob];
            mvmv.run();
            expect(globby.sync(srcGlob).length).to.eql(0);
            expect(globby.sync(dstGlob).length).to.eql(4);
            expect(globby.sync(starGlob).length).to.eql(allFiles.length);
            expect(globby.sync(starGlob)).to.not.have.members(allFiles);
            expect(console.log.lastCall.calledWith(`\x1b[36mMoved 2 file(s)\x1b[0m`)).to.be.true;

            // should work even when destination path exists but is different than source path
            srcGlob = path.join(TEST_PATH, '*.jpeg');
            dstGlob = path.join('test', 'test-data2', '*.png');
            expect(globby.sync(srcGlob).length).to.eql(2);
            expect(globby.sync(dstGlob).length).to.eql(0);
            process.argv = [process.execPath, 'mvmv.js', srcGlob, dstGlob];
            mvmv.run();
            expect(globby.sync(srcGlob).length).to.eql(0);
            expect(globby.sync(dstGlob).length).to.eql(2);
            expect(globby.sync(starGlob).length).to.eql(allFiles.length - 2);
            expect(globby.sync(path.join('test', 'test-data2', '*'))).to.have.members(globby.sync(dstGlob));
            expect(console.log.lastCall.calledWith(`\x1b[36mMoved 2 file(s)\x1b[0m`)).to.be.true;

            // Cases where wildcards are used in paths
            srcGlob = path.join('t???', 'test-d*ta**', '*.js');
            dstGlob = path.join('test', 't???-dat**2', '*.es6');
            process.argv = [process.execPath, 'mvmv.js', srcGlob, dstGlob];
            mvmv.run();
            expect(globby.sync(srcGlob)).to.be.empty;
            expect(globby.sync(dstGlob).length).to.eql(2);
            expect(console.log.lastCall.calledWith(`\x1b[36mMoved 2 file(s)\x1b[0m`)).to.be.true;


        });

        it('should handle backward-slash \\ character correctly, according to operating system', function () {
            let srcGlob = 'test\\\\test-data\\dot*.?.*';
            let dstGlob = 'test\\test-data2\\\\bot*.?';
            if (IS_WINOS) {
                expect(globby.sync(srcGlob).length).to.eql(4);
            }
            else {
                expect(globby.sync(srcGlob)).to.be.empty;
            }
            process.argv = [process.execPath, 'mvmv.js', srcGlob, dstGlob];
            mvmv.run();
            if (IS_WINOS) {
                expect(globby.sync(srcGlob)).to.be.empty;
                expect(globby.sync('test/test-data2/*.a')).to.have.members([ 'test/test-data2/botnames1.a', 'test/test-data2/botnames2.a' ]);
                expect(globby.sync('test/test-data2/*.z')).to.have.members([ 'test/test-data2/botdotnames1.z', 'test/test-data2/botdotnames2.z']);
                expect(console.log.lastCall.calledWith(`\x1b[36mMoved 4 file(s)\x1b[0m`)).to.be.true;
            }
            else {
                expect(console.log.lastCall.calledWith(`Target file not found.`)).to.be.true;
            }

            // Case with trailing '\' in source
            srcGlob = 'test\\test-data\\*.JS\\\\';
            dstGlob = 'test\\test-data2\\*.JS';
            process.argv = [process.execPath, 'mvmv.js', srcGlob, dstGlob];
            mvmv.run();
            expect(console.log.lastCall.calledWith(`Target file not found.`)).to.be.true;
            if (IS_WINOS) {
                expect(globby.sync('test\\test-data\\*.JS').length).to.eql(2);
            }
            else {
                expect(globby.sync('test\\test-data\\*.JS')).to.be.empty;
            }
            expect(globby.sync(srcGlob)).to.be.empty;
            expect(globby.sync(dstGlob)).to.be.empty;
            expect(globby.sync('test/test-data/*.JS').length).to.eql(2);
            expect(globby.sync('test/test-data2/*.JS')).to.be.empty;

            // Case with trailing '\' in destination, when destination files do not already exist
            srcGlob = 'test\\test-data\\*.JS';
            dstGlob = 'test\\test-data2\\*.JS\\\\';
            process.argv = [process.execPath, 'mvmv.js', srcGlob, dstGlob];
            mvmv.run();
            // On Windows: afile.JS/ would be successfully written as afile.JS
            if (IS_WINOS) {
                expect(console.log.lastCall.calledWith(`\x1b[36mMoved 2 file(s)\x1b[0m`)).to.be.true;
                expect(globby.sync(srcGlob)).to.be.empty;
                expect(globby.sync('test\\test-data2\\*.JS').length).to.eql(2);
            }
            else {
                expect(console.log.lastCall.calledWith(`Target file not found.`)).to.be.true;
                expect(globby.sync(srcGlob)).to.be.empty;
                expect(globby.sync(dstGlob)).to.be.empty;
                expect(globby.sync('test/test-data2/*.JS')).to.be.empty;
                expect(globby.sync('test/test-data/*.JS').length).to.eql(2);
            }

            // Case with trailing '\' in destination, when destination files already exist
            srcGlob = 'test\\test-data\\^onecaret.up^';
            dstGlob = 'test\\test-data\\^onecaret.up^\\\\';
            process.argv = [process.execPath, 'mvmv.js', srcGlob, dstGlob];
            mvmv.run();
            if (IS_WINOS) {
                expect(globby.sync(srcGlob).length).to.eql(1);
                expect(console.log.withArgs(`Skipping 'test/test-data/^onecaret.up^': 'test/test-data/^onecaret.up^' already exists.`).calledOnce).to.be.true;
                expect(console.log.lastCall.calledWith(`\x1b[36mMoved 0 file(s)\x1b[0m`)).to.be.true;
            }
            else {
                expect(console.log.lastCall.calledWith(`Target file not found.`)).to.be.true;
                expect(globby.sync(srcGlob)).to.be.empty;
                expect(globby.sync(dstGlob)).to.be.empty;
                expect(globby.sync('test/test-data/^onecaret.up^').length).to.eql(1);
                expect(globby.sync('test/test-data/^onecaret.up^//')).to.be.empty;
            }
        });

        it('should handle forward-slash character / correctly, according to operating system', function () {
            let srcGlob = 'test//test-data///*.txt';
            let dstGlob = 'test///test-data2////*.out';
            process.argv = [process.execPath, 'mvmv.js', srcGlob, dstGlob];
            mvmv.run();
            expect(globby.sync(srcGlob)).to.be.empty;
            expect(globby.sync(dstGlob).length).to.eql(2);
            expect(console.log.lastCall.calledWith(`\x1b[36mMoved 2 file(s)\x1b[0m`)).to.be.true;

            // Case with trailing '/' in source
            console.log.reset();
            srcGlob = 'test////test-data///*.js///';
            dstGlob = 'test//test-data2/*.js';
            process.argv = [process.execPath, 'mvmv.js', srcGlob, dstGlob];
            mvmv.run();
            expect(globby.sync('test/test-data/*.js').length).to.eql(2);
            expect(globby.sync(dstGlob)).to.be.empty;
            expect(console.log.lastCall.calledWith(`Target file not found.`)).to.be.true;

            // Case with trailing '/' in destination, but destination does not already exist
            console.log.reset();
            srcGlob = 'test//test-data/$$twodollars.js$$';
            dstGlob = 'test///test-data2/bob////';
            process.argv = [process.execPath, 'mvmv.js', srcGlob, dstGlob];
            mvmv.run();
            expect(globby.sync(srcGlob)).to.be.empty;
            // On Windows: destination 'afile.ext/' would be successfully written as afile.ext
            // On MacOS: Moving to destination 'filename.ext/' would fail with 'Error: ENOENT: no such file or directory' BUT:
            // it would succeed with mock-fs on MacOS! See https://github.com/tschaub/mock-fs/issues/227
            expect(globby.sync('test/test-data2/bob').length).to.eql(1);
            expect(console.log.lastCall.calledWith(`\x1b[36mMoved 1 file(s)\x1b[0m`)).to.be.true;

            // Case with trailing '/' in destination, when destination already exists
            console.log.reset();
            srcGlob = 'test/test-data/$onedollar.tm$';
            dstGlob = 'test//test-data/$onedollar.tm$////';
            process.argv = [process.execPath, 'mvmv.js', srcGlob, dstGlob];
            mvmv.run();
            expect(globby.sync(srcGlob).length).to.eql(1);
            expect(console.log.withArgs(`Skipping '${srcGlob}': 'test/test-data/$onedollar.tm$' already exists.`).calledOnce).to.be.true;
            expect(console.log.lastCall.calledWith(`\x1b[36mMoved 0 file(s)\x1b[0m`)).to.be.true;
        });

        it('should refuse to perform move if source and/or destinations are folders', function () {
            sinon.spy(commander, 'outputHelp');

            // Case where source is a folder
            // Expect 'Target file not found' as move/rename of folders not supported
            let srcGlob = 'test\\test-data';
            let dstGlob = 'test\\\\test-data2\\a.file';
            const starGlob = path.join(TEST_PATH, '*');
            let allFiles = globby.sync(starGlob);
            process.argv = [process.execPath, 'mvmv.js', srcGlob, dstGlob];
            mvmv.run();
            expect(console.log.lastCall.calledWith(`Target file not found.`)).to.be.true;
            expect(globby.sync(starGlob)).to.have.members(allFiles);

            srcGlob = 'test///test-data2';
            dstGlob = 'test//test-data///another.file';
            process.argv = [process.execPath, 'mvmv.js', srcGlob, dstGlob];
            mvmv.run();
            expect(console.log.lastCall.calledWith(`Target file not found.`)).to.be.true;
            expect(globby.sync(starGlob)).to.have.members(allFiles);

            // Case where destination is a folder
            console.log.reset();
            srcGlob = 'test///test-data//^^twocarets.hi^^';
            dstGlob = 'test\\\\test-data2';
            let srcFiles = globby.sync(srcGlob);
            expect(srcFiles.length).to.eql(1);
            process.argv = [process.execPath, 'mvmv.js', srcGlob, dstGlob];
            mvmv.run();
            if (IS_WINOS) {
                // Move should fail because 'test/test-data2' already exists.
                expect(console.log.withArgs(`Skipping '${srcFiles[0]}': 'test/test-data2' already exists.`).calledOnce).to.be.true;
                expect(console.log.lastCall.calledWith(`\x1b[36mMoved 0 file(s)\x1b[0m`)).to.be.true;
                expect(globby.sync(srcGlob)).to.have.members(srcFiles);
            }
            else {
                expect(console.log.lastCall.calledWith(`\x1b[36mMoved 1 file(s)\x1b[0m`)).to.be.true;
                expect(globby.sync(srcGlob)).to.be.empty;
                // File 'test\\test-data2' should be created
                // Note: In code '\\\\' --> in glob '\\'  --> matches character '\' in character
                expect(globby.sync('test\\\\\\\\test-data2').length).to.eql(1);
            }

            expect(commander.outputHelp.notCalled).to.be.true;
            commander.outputHelp.restore();

            // At some point, calling too many times mvmv.run() will generate MaxListenersExceededWarning.
            // To avoid this warning, we need to reset 'commander'.
            // We have to do the following because 'commander' module does not offer a way to reset itself.
            mockFs.restore();
            reloadApp();
            populateMockedFS(mockFs);
            sinon.spy(commander, 'outputHelp');

            // Case with trailing '\' in source folder name
            console.log.reset();
            allFiles = globby.sync(starGlob);
            srcGlob = 'test\\test-data\\\\';
            dstGlob = 'test/test-data2/a.file';
            process.argv = [process.execPath, 'mvmv.js', srcGlob, dstGlob];
            mvmv.run();
            // MacOS/Linux: file test\test-data\\ does not exist
            // Windows: Expect 'Target file not found' as move/rename of folders not supported
            expect(console.log.lastCall.calledWith(`Target file not found.`)).to.be.true;
            expect(globby.sync(starGlob)).to.have.members(allFiles);
            expect(globby.sync(dstGlob)).to.be.empty;

            // Case with trailing '\' in destination folder name
            console.log.reset();
            srcGlob = 'test/test-data/dotdotnames2.z..';
            dstGlob = 'test\\test-data2\\\\\\';
            srcFiles = globby.sync(srcGlob);
            process.argv = [process.execPath, 'mvmv.js', srcGlob, dstGlob];
            mvmv.run();
            if (IS_WINOS) {
                expect(console.log.withArgs(`Skipping '${srcFiles[0]}': 'test/test-data2' already exists.`).calledOnce).to.be.true;
                // Expect no change in src folder's content
                expect(globby.sync(srcGlob).length).to.eql(srcFiles.length);
                expect(globby.sync(srcGlob)).to.have.members(srcFiles);
                expect(globby.sync('test/test-data2/*')).to.be.empty;
            }
            else {
                expect(console.log.lastCall.calledWith(`\x1b[36mMoved 1 file(s)\x1b[0m`)).to.be.true;
                expect(globby.sync(srcGlob)).to.be.empty;
                // File 'test\\test-data2' should be created
                // Note: In code '\\\\' --> in glob '\\'  --> matches character '\' in character
                expect(globby.sync('test\\\\test-data2\\\\\\\\\\\\').length).to.eql(1);
            }

            expect(commander.outputHelp.notCalled).to.be.true;
            commander.outputHelp.restore();

            // At some point, calling too many times mvmv.run() will generate MaxListenersExceededWarning.
            // To avoid this warning, we need to reset 'commander'.
            // We have to do the following because 'commander' module does not offer a way to reset itself.
            mockFs.restore();
            reloadApp();
            populateMockedFS(mockFs);
            sinon.spy(commander, 'outputHelp');

            // Case with trailing '/' in source folder name
            console.log.reset();
            allFiles = globby.sync(starGlob);
            srcGlob = 'test///test-data///';
            dstGlob = 'test\\test-data2\\\\\\a.file';
            process.argv = [process.execPath, 'mvmv.js', srcGlob, dstGlob];
            mvmv.run();
            // Expect 'Target file not found' as move/rename of folders not supported
            expect(console.log.lastCall.calledWith(`Target file not found.`)).to.be.true;
            expect(globby.sync(starGlob)).to.have.members(allFiles);
            expect(globby.sync('test/test-data2/*')).to.be.empty;

            // Case with trailing '/' in destination folder name
            console.log.reset();
            srcGlob = 'test\\\\\\test-data\\\\dotnames2.a.b';
            dstGlob = 'test///test-data2///';
            srcFiles = globby.sync(srcGlob);
            expect(globby.sync(dstGlob).length).to.eql(1);
            process.argv = [process.execPath, 'mvmv.js', srcGlob, dstGlob];
            mvmv.run();
            if (IS_WINOS) {
                expect(console.log.withArgs(`Skipping '${srcFiles[0]}': 'test/test-data2' already exists.`).calledOnce).to.be.true;
                // Expect no change in src folder's content
                expect(globby.sync(srcGlob).length).to.eql(srcFiles.length);
                expect(globby.sync(srcGlob)).to.have.members(srcFiles);
                expect(globby.sync('test/test-data2/*')).to.be.empty;
            }
            else {
                // File 'test\\\test-data\dotnames2.a.b' does not exist
                expect(console.log.lastCall.calledWith(`Target file not found.`)).to.be.true;
                expect(globby.sync(srcGlob)).to.be.empty;
                // test/test-data2/ exists
                expect(globby.sync('test/test-data2/*')).to.be.empty;
            }
            expect(globby.sync(dstGlob).length).to.eql(1);

            expect(commander.outputHelp.notCalled).to.be.true;
            commander.outputHelp.restore();
        });

        it('should display a message if destination already exists', function () {
            sinon.spy(commander, 'outputHelp');

            // Case where destination file already exists: move should abort
            let srcGlob = path.join(TEST_PATH, '^onecaret.up^');
            let dstGlob = path.join(TEST_PATH, '^^onecaret.up^');
            process.argv = [process.execPath, 'mvmv.js', srcGlob, dstGlob];
            mvmv.run();
            expect(console.log.withArgs(`Skipping '${srcGlob}': '${dstGlob}' already exists.`).calledOnce).to.be.true;
            expect(globby.sync(srcGlob).length).to.eql(1);
            expect(console.log.lastCall.calledWith(`\x1b[36mMoved 0 file(s)\x1b[0m`)).to.be.true;

            // Case where multiple moves use the same destination filename: only one of the moves succeeds
            srcGlob = path.join(TEST_PATH, '*.JPEG');
            let srcFiles = globby.sync(srcGlob);
            expect(srcFiles.length).to.eql(2);
            dstGlob = path.join(TEST_PATH, 'newName.jpg');
            expect(globby.sync(dstGlob)).to.be.empty;
            process.argv = [process.execPath, 'mvmv.js', srcGlob, dstGlob];
            mvmv.run();
            expect(console.log.withArgs(`Skipping '${srcFiles[1]}': '${dstGlob}' already exists.`).calledOnce).to.be.true;
            expect(console.log.lastCall.calledWith(`\x1b[36mMoved 1 file(s)\x1b[0m`)).to.be.true;
            expect(globby.sync(srcGlob).length).to.eql(1);
            expect(globby.sync(dstGlob).length).to.eql(1);

            expect(commander.outputHelp.notCalled).to.be.true;
            commander.outputHelp.restore();
        });

        it('should display a message if no source file found', function () {
            sinon.spy(commander, 'outputHelp');
            let starGlob = path.join(TEST_PATH, '*');
            let allFiles = globby.sync(starGlob);
            let srcGlob = path.join(TEST_PATH, '*.doc');
            let dstGlob = path.join(TEST_PATH, '*.pdf');
            expect(globby.sync(srcGlob).length).to.eql(0);

            expect(globby.sync(dstGlob).length).to.eql(0);
            process.argv = [process.execPath, 'mvmv.js', srcGlob, dstGlob];
            mvmv.run();
            expect(console.log.withArgs(`Target file not found.`).calledOnce).to.be.true;
            // Valid command line, usage info should NOT be displayed
            expect(globby.sync(starGlob)).to.have.members(allFiles);

            expect(commander.outputHelp.notCalled).to.be.true;
            commander.outputHelp.restore();
        });

        it('should display message if destination path does not exist', function () {
            let starGlob = path.join(TEST_PATH, '*');
            let allFiles = globby.sync(starGlob);
            let srcGlob = path.join(TEST_PATH, '*.JS');
            let dstGlob = path.join('test', 'newpath', '*.es6');
            expect(globby.sync(srcGlob).length).to.eql(2);
            expect(globby.sync(dstGlob).length).to.eql(0);

            sinon.spy(commander, 'outputHelp');
            process.argv = [process.execPath, 'mvmv.js', srcGlob, dstGlob];
            mvmv.run();
            expect(console.log.calledWith(sinon.match('no such file or directory'))).to.be.true;
            expect(console.log.withArgs(`\x1b[36mMoved 0 file(s)\x1b[0m`).calledOnce).to.be.true;
            // Valid command line, usage info should NOT be displayed
            expect(globby.sync(starGlob)).to.have.members(allFiles);
            expect(globby.sync(srcGlob).length).to.eql(2);
            expect(globby.sync(dstGlob).length).to.eql(0);

            expect(commander.outputHelp.notCalled).to.be.true;
            commander.outputHelp.restore();
        });

        it('should display operations, when in --verbose mode', function () {
            let srcGlob = path.join(TEST_PATH, 'dotnames?.a.b');
            let dstGlob = path.join(TEST_PATH, 'dotnames.a.b.old');
            let starGlob = path.join(TEST_PATH, '*');
            let allFiles = globby.sync(starGlob);
            let srcFiles = globby.sync(srcGlob);
            let dstFiles = globby.sync(dstGlob);

            expect(srcFiles.length).to.eql(2);
            expect(dstFiles.length).to.eql(0);
            process.argv = [process.execPath, 'mvmv.js', '--verbose', srcGlob, dstGlob];
            mvmv.run();
            // Verify that verbose mode printout was performed...
            expect(console.log.withArgs(`Moved \x1b[37;1m${srcFiles[0]}\x1b[0m to \x1b[37;1m${dstGlob}\x1b[0m`).calledOnce).to.be.true;
            expect(globby.sync(dstGlob).length).to.eql(1);
            // Second source file should NOT be moved as destination file already exists (due to move of first source file)
            expect(globby.sync(srcGlob)).to.have.members([ srcFiles[1] ]);
            expect(console.log.withArgs(`Skipping '${srcFiles[1]}': '${dstGlob}' already exists.`).calledOnce).to.be.true;
            expect(globby.sync(starGlob).length).to.eql(allFiles.length);
            expect(globby.sync(starGlob)).to.not.have.members(allFiles);
            expect(console.log.withArgs(`\x1b[36mMoved 1 file(s)\x1b[0m`).calledOnce).to.be.true;
        });

        it('should display operational output but should not change the file system, when in --simulate mode', function () {
            let srcGlob = path.join(TEST_PATH, '*js$$');
            let srcFiles = globby.sync(srcGlob);
            let dstGlob = path.join(TEST_PATH, '*hi^^');
            let newFilenames = srcFiles.map(function (filename) {
                return filename.replace(/js\$\$$/, 'hi^^');
            });
            const starGlob = path.join(TEST_PATH, '*');
            const allFiles = globby.sync(starGlob);

            process.argv = [process.execPath, 'mvmv.js', '--simulate', srcGlob, dstGlob];
            mvmv.run();
            expect(console.log.withArgs(`[Simulate] Moved \x1b[37;1m${srcFiles[0]}\x1b[0m to \x1b[37;1m${newFilenames[0]}\x1b[0m`).calledOnce).to.be.true;
            expect(console.log.withArgs(`[Simulate] Moved \x1b[37;1m${srcFiles[1]}\x1b[0m to \x1b[37;1m${newFilenames[1]}\x1b[0m`).calledOnce).to.be.true;
            expect(console.log.lastCall.calledWith(`[Simulate] \x1b[36mMoved 2 file(s)\x1b[0m`)).to.be.true;

            // Case where destination path is different than source path
            srcGlob = path.join(TEST_PATH, 'dotdotnames1.z..');
            srcFiles = globby.sync(srcGlob);
            dstGlob = path.join('test', 'test-data2', 'dotdotnames2.z..');
            expect(srcFiles.length).to.eql(1);
            expect(globby.sync(dstGlob)).to.be.empty;
            process.argv = [process.execPath, 'mvmv.js', '--simulate', srcGlob, dstGlob];
            mvmv.run();
            expect(console.log.withArgs(`[Simulate] Moved \x1b[37;1m${srcFiles[0]}\x1b[0m to \x1b[37;1m${dstGlob}\x1b[0m`).calledOnce).to.be.true;
            expect(console.log.lastCall.calledWith(`[Simulate] \x1b[36mMoved 1 file(s)\x1b[0m`)).to.be.true;

            // Case where destination has trailing path sep '/'
            // Move to test/test-data2/bob should succeed
            srcGlob = path.join(TEST_PATH, '$$twodollars.js$$');
            srcFiles = globby.sync(srcGlob);
            expect(srcFiles.length).to.eql(1);
            dstGlob = path.join('test', 'test-data2', 'bob', '/');
            process.argv = [process.execPath, 'mvmv.js', '--simulate', srcGlob, dstGlob];
            mvmv.run();
            expect(console.log.withArgs(`[Simulate] Moved \x1b[37;1m${srcFiles[0]}\x1b[0m to \x1b[37;1mtest/test-data2/bob\x1b[0m`).calledOnce).to.be.true;
            expect(console.log.lastCall.calledWith(`[Simulate] \x1b[36mMoved 1 file(s)\x1b[0m`)).to.be.true;

            // No file has changed in simulate mode
            expect(globby.sync(starGlob)).to.have.members(allFiles);
            expect(globby.sync(starGlob).length).to.eql(allFiles.length);
            expect(globby.sync(path.join('test', 'test-data2', '*'))).to.be.empty;
        });

        it('should display the proper message for problematic cases, when in --simulate mode', function () {
            const starGlob = path.join(TEST_PATH, '*');
            const allFiles = globby.sync(starGlob);

            // Case where destination file already exists.
            let srcGlob = path.join(TEST_PATH, '^onecaret.up^');
            let dstGlob = path.join(TEST_PATH, '^^onecaret.up^');
            process.argv = [process.execPath, 'mvmv.js', '--simulate', srcGlob, dstGlob];
            mvmv.run();
            expect(console.log.withArgs(`[Simulate] Skipping '${srcGlob}': '${dstGlob}' already exists.`).calledOnce).to.be.true;
            expect(console.log.lastCall.calledWith(`[Simulate] \x1b[36mMoved 0 file(s)\x1b[0m`)).to.be.true;

            // Case where multiple moves use the same destination filename.
            srcGlob = path.join(TEST_PATH, '*.JPEG');
            let srcFiles = globby.sync(srcGlob);
            dstGlob = path.join(TEST_PATH, 'newName.jpg');
            process.argv = [process.execPath, 'mvmv.js', '--simulate', srcGlob, dstGlob];
            mvmv.run();
            expect(console.log.withArgs(`[Simulate] Moved \x1b[37;1m${srcFiles[0]}\x1b[0m to \x1b[37;1m${dstGlob}\x1b[0m`).calledOnce).to.be.true;
            expect(console.log.withArgs(`[Simulate] Skipping '${srcFiles[1]}': '${dstGlob}' already exists.`).calledOnce).to.be.true;
            expect(console.log.lastCall.calledWith(`[Simulate] \x1b[36mMoved 1 file(s)\x1b[0m`)).to.be.true;

            // Case where destination has trailing path sep '/'
            // Move should fail because 'test/test-data2' (trailing '/' is omitted) already exists.
            srcGlob = path.join(TEST_PATH, '^^twocarets.hi^^');
            srcFiles = globby.sync(srcGlob);
            dstGlob = path.join('test', 'test-data2', '/');
            expect(srcFiles.length).to.eql(1);
            process.argv = [process.execPath, 'mvmv.js', '--simulate', srcGlob, dstGlob];
            mvmv.run();
            expect(console.log.withArgs(`[Simulate] Skipping '${srcFiles[0]}': 'test/test-data2' already exists.`).calledOnce).to.be.true;
            expect(console.log.lastCall.calledWith(`[Simulate] \x1b[36mMoved 0 file(s)\x1b[0m`)).to.be.true;

            // Case where destination path does not exist
            srcGlob = path.join(TEST_PATH, '*.JS');
            dstGlob = path.join('test', 'newpath', '*.es6');
            expect(globby.sync(srcGlob).length).to.eql(2);
            expect(fs.existsSync(path.join('test', 'newpath'))).to.be.false;
            process.argv = [process.execPath, 'mvmv.js', '--simulate', srcGlob, dstGlob];
            mvmv.run();
            expect(console.log.calledWith(sinon.match('[Simulate] No such file or directory'))).to.be.true;
            expect(console.log.lastCall.calledWith(`[Simulate] \x1b[36mMoved 0 file(s)\x1b[0m`)).to.be.true;
            expect(fs.existsSync(path.join('test', 'newpath'))).to.be.false;

            // Case where source is not found
            srcGlob = path.join(TEST_PATH, '*.doc');
            dstGlob = path.join(TEST_PATH, '*.pdf');
            expect(globby.sync(srcGlob)).to.be.empty;
            process.argv = [process.execPath, 'mvmv.js', '--simulate', srcGlob, dstGlob];
            mvmv.run();
            expect(console.log.calledWith(sinon.match('[Simulate] Target file not found.'))).to.be.true;
            expect(console.log.lastCall.calledWith(`[Simulate] \x1b[36mMoved 0 file(s)\x1b[0m`)).to.be.false;

            // No file has changed in simulate mode
            expect(globby.sync(starGlob)).to.have.members(allFiles);
            expect(globby.sync(starGlob).length).to.eql(allFiles.length);
            expect(globby.sync(path.join('test', 'test-data2', '*'))).to.be.empty;
        });

        // The following test does not work with mock-fs on Windows, nor on Travis CI. Perform a manual test instead.
        // To enable this test case: env MVMV_TEST_MODE=interactive npm test
        if (!IS_WINOS && (process.env.MVMV_TEST_MODE === 'interactive')) {
            it('should ask for confirmation for each operation, when in --interactive mode', function () {
                let srcGlob = path.join(TEST_PATH, '*.js');
                let dstGlob = path.join(TEST_PATH, '*.old');
                let times = globby.sync(srcGlob).length;

                sinon.spy(readlineSync, 'keyInYN');

                process.argv = [process.execPath, 'mvmv.js', '--interactive', srcGlob, dstGlob];
                // require('child_process').fork('./misc/mvmv-child.js', { stdio: 'inherit' });
                robot.keyTap('y');
                for (let i = times - 1; i > 0; i -= 1 ) {
                    robot.keyTap('n');
                }

                mvmv.run();
                expect(readlineSync.keyInYN.callCount).to.eql(times);
                expect(console.log.lastCall.calledWith(sinon.match(`Moved 1 file(s)`))).to.be.true;
                readlineSync.keyInYN.restore();
            });
        }
        /* ----------------------------------------------------- */
        /* ------------ before() and after() section ----------- */
        /* ----------------------------------------------------- */
        beforeEach(function () {
            populateMockedFS(mockFs);

            this.argv = process.argv;   // backs up argv
            sinon.spy(console, 'log');
        });

        afterEach(function () {
            mockFs.restore();
            reloadApp();
            process.argv = this.argv;
            console.log.restore();
        });
    });
});
