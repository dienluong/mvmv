'use strict';

let mvjs           = require('../src/mvjs');
let commander       = require('commander');
const readlineSync  = require('readline-sync');

const path          = require('path').posix;
const fs            = require('fs');
const mockFs        = require('mock-fs');
const globby        = require('globby');
const FilenameGen   = require('natural-filename-generator');
const expect        = require('chai').expect;
const sinon         = require('sinon');
const TEST_PATH     = path.join('test', 'test-data');

/**
 * Resets the 'commander' module by reloading it, both in mvjs module and in this test module.
 */
function reloadApp() {
    delete require.cache[ require.resolve('../src/mvjs') ];
    delete require.cache[ require.resolve('commander') ];
    mvjs       = require('../src/mvjs');
    commander   = require('commander');
}

describe('myApp', function () {
    describe('when arguments is not correct', function () {
        it('should display usage help info', function () {
            process.argv = [process.execPath, 'mvjs.js'];
            reloadApp();
            sinon.spy(commander, 'outputHelp');
            mvjs.run();
            expect(commander.outputHelp.called).to.be.true;
            commander.outputHelp.restore();

            process.argv = [process.execPath, 'mvjs.js', 'a.file'];
            reloadApp();
            sinon.spy(commander, 'outputHelp');
            mvjs.run();
            expect(commander.outputHelp.called).to.be.true;
            commander.outputHelp.restore();

            process.argv = [process.execPath, 'mvjs.js', '--verbose'];
            reloadApp();
            sinon.spy(commander, 'outputHelp');
            mvjs.run();
            expect(commander.outputHelp.called).to.be.true;
            commander.outputHelp.restore();

            process.argv = [process.execPath, 'mvjs.js', '--simulate', 'a.file'];
            reloadApp();
            sinon.spy(commander, 'outputHelp');
            mvjs.run();
            expect(commander.outputHelp.called).to.be.true;
            commander.outputHelp.restore();

            process.argv = [process.execPath, 'mvjs.js', '--interaktiv', path.join(TEST_PATH, '*.jpeg'), path.join(TEST_PATH, '*.jpg')];
            reloadApp();
            sinon.spy(commander, 'outputHelp');
            mvjs.run();
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

            // Simulate command: node mvjs.js <src> <dst>
            process.argv = [process.execPath, 'mvjs.js', srcGlob, dstGlob];
            mvjs.run();
            expect(globby.sync(srcGlob).length).to.eql(0);
            expect(globby.sync(dstGlob).length).to.eql(4);
            expect(globby.sync(starGlob).length).to.eql(allFiles.length);
            expect(globby.sync(starGlob)).to.not.have.members(allFiles);
            expect(console.log.lastCall.calledWith(`\x1b[36mRenamed 2 file(s)\x1b[0m`)).to.be.true;

            // should work even when destination path exists but is different than source path
            srcGlob = path.join(TEST_PATH, '*.jpeg');
            dstGlob = path.join('test', 'test-data2', '*.png');
            expect(globby.sync(srcGlob).length).to.eql(2);
            expect(globby.sync(dstGlob).length).to.eql(0);
            process.argv = [process.execPath, 'mvjs.js', srcGlob, dstGlob];
            mvjs.run();
            expect(globby.sync(srcGlob).length).to.eql(0);
            expect(globby.sync(dstGlob).length).to.eql(2);
            expect(globby.sync(starGlob).length).to.eql(allFiles.length - 2);
            expect(globby.sync(path.join('test', 'test-data2', '*'))).to.have.members(globby.sync(dstGlob));
            expect(console.log.lastCall.calledWith(`\x1b[36mRenamed 2 file(s)\x1b[0m`)).to.be.true;

            // Cases where wildcards are used in paths
            srcGlob = path.join('t???', 'test-d*ta**', '*.js');
            dstGlob = path.join('test', 't???-dat**2', '*.es6');
            process.argv = [process.execPath, 'mvjs.js', srcGlob, dstGlob];
            mvjs.run();
            expect(globby.sync(srcGlob)).to.be.empty;
            expect(globby.sync(dstGlob).length).to.eql(2);
            expect(console.log.lastCall.calledWith(`\x1b[36mRenamed 2 file(s)\x1b[0m`)).to.be.true;


        });

        it('should handle \\ and / characters correctly, according to operating system', function () {
            sinon.spy(commander, 'outputHelp');

            // Cases with Windows path separator '\'
            let srcGlob = 'test\\\\test-data\\dot*.?.*';
            let dstGlob = 'test\\test-data2\\\\bot*.?';
            if (process.platform === 'win32') {
                expect(globby.sync(srcGlob).length).to.eql(4);
            }
            else {
                expect(globby.sync(srcGlob)).to.be.empty;
            }
            process.argv = [process.execPath, 'mvjs.js', srcGlob, dstGlob];
            mvjs.run();
            if (process.platform === 'win32') {
                expect(globby.sync(srcGlob)).to.be.empty;
                expect(globby.sync('test/test-data2/*.a')).to.have.members([ 'test/test-data2/botnames1.a', 'test/test-data2/botnames2.a' ]);
                expect(globby.sync('test/test-data2/*.z')).to.have.members([ 'test/test-data2/botdotnames1.z', 'test/test-data2/botdotnames2.z']);
                expect(console.log.lastCall.calledWith(`\x1b[36mRenamed 4 file(s)\x1b[0m`)).to.be.true;
            }
            else {
                expect(console.log.lastCall.calledWith(`File not found.`)).to.be.true;
            }

            console.log.reset();
            let starGlob = path.join(TEST_PATH, '*');
            let allFiles = globby.sync(starGlob);
            srcGlob = 'test\\test-data\\\\';
            dstGlob = 'test\\\\test-data2\\';
            process.argv = [process.execPath, 'mvjs.js', srcGlob, dstGlob];
            mvjs.run();
            // MacOS/Linux: file test\test-data\\ does not exist
            // Windows: File 'test-data' does not exist (it is a folder)
            expect(console.log.withArgs(`File not found.`).calledOnce).to.be.true;
            expect(commander.outputHelp.called).to.be.false;
            expect(globby.sync(starGlob)).to.have.members(allFiles);

            // Case where destination has trailing path sep '/': it should be omitted.
            // Rename to test/test-data2/bob should succeed because 'bob' does not already exist.
            console.log.reset();
            srcGlob = path.join(TEST_PATH, '$$twodollars.js$$');
            expect(globby.sync(srcGlob).length).to.eql(1);
            dstGlob = path.join('test', 'test-data2', 'bob', '/');
            process.argv = [process.execPath, 'mvjs.js', srcGlob, dstGlob];
            mvjs.run();
            expect(globby.sync(srcGlob)).to.be.empty;
            expect(globby.sync(path.join('test', 'test-data2', 'bob')).length).to.eql(1);
            expect(console.log.lastCall.calledWith(`\x1b[36mRenamed 1 file(s)\x1b[0m`)).to.be.true;

            // Case where destination has trailing path sep '/'
            // Rename should fail because 'test/test-data2' (trailing '/' is omitted) already exists.
            console.log.reset();
            srcGlob = path.join(TEST_PATH, '^^twocarets.hi^^');
            let srcFiles = globby.sync(srcGlob);
            dstGlob = path.join('test', 'test-data2', '/');
            expect(srcFiles.length).to.eql(1);
            process.argv = [process.execPath, 'mvjs.js', srcGlob, dstGlob];
            mvjs.run();
            expect(console.log.withArgs(`Skipping rename of '${srcFiles[0]}': 'test/test-data2' already exists.`).calledOnce).to.be.true;
            expect(console.log.lastCall.calledWith(`\x1b[36mRenamed 0 file(s)\x1b[0m`)).to.be.true;
            expect(globby.sync(srcGlob)).to.have.members(srcFiles);

            commander.outputHelp.restore();
        });

        it('should display a message if destination already exists', function () {
            // Case where destination file already exists: rename should abort
            let srcGlob = path.join(TEST_PATH, '^onecaret.up^');
            let dstGlob = path.join(TEST_PATH, '^^onecaret.up^');
            process.argv = [process.execPath, 'mvjs.js', srcGlob, dstGlob];
            mvjs.run();
            expect(console.log.withArgs(`Skipping rename of '${srcGlob}': '${dstGlob}' already exists.`).calledOnce).to.be.true;
            expect(globby.sync(srcGlob).length).to.eql(1);
            expect(console.log.lastCall.calledWith(`\x1b[36mRenamed 0 file(s)\x1b[0m`)).to.be.true;

            // Case where multiple renames use the same destination filename: only one of the renames succeeds
            srcGlob = path.join(TEST_PATH, '*.JPEG');
            let srcFiles = globby.sync(srcGlob);
            expect(srcFiles.length).to.eql(2);
            dstGlob = path.join(TEST_PATH, 'newName.jpg');
            expect(globby.sync(dstGlob).length).to.be.empty;
            process.argv = [process.execPath, 'mvjs.js', srcGlob, dstGlob];
            mvjs.run();
            expect(console.log.withArgs(`Skipping rename of '${srcFiles[1]}': '${dstGlob}' already exists.`).calledOnce).to.be.true;
            expect(console.log.lastCall.calledWith(`\x1b[36mRenamed 1 file(s)\x1b[0m`)).to.be.true;
            expect(globby.sync(srcGlob).length).to.eql(1);
            expect(globby.sync(dstGlob).length).to.eql(1);
        });

        it('should display a message if no source file found', function () {
            let starGlob = path.join(TEST_PATH, '*');
            let allFiles = globby.sync(starGlob);
            let srcGlob = path.join(TEST_PATH, '*.doc');
            let dstGlob = path.join(TEST_PATH, '*.pdf');
            expect(globby.sync(srcGlob).length).to.eql(0);
            expect(globby.sync(dstGlob).length).to.eql(0);

            sinon.spy(commander, 'outputHelp');
            process.argv = [process.execPath, 'mvjs.js', srcGlob, dstGlob];
            mvjs.run();
            expect(console.log.withArgs(`File not found.`).calledOnce).to.be.true;
            // Valid command line, usage info should NOT be displayed
            expect(commander.outputHelp.called).to.be.false;
            expect(globby.sync(starGlob)).to.have.members(allFiles);

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
            process.argv = [process.execPath, 'mvjs.js', srcGlob, dstGlob];
            mvjs.run();
            expect(console.log.calledWith(sinon.match('no such file or directory'))).to.be.true;
            expect(console.log.withArgs(`\x1b[36mRenamed 0 file(s)\x1b[0m`).calledOnce).to.be.true;
            // Valid command line, usage info should NOT be displayed
            expect(commander.outputHelp.called).to.be.false;
            expect(globby.sync(starGlob)).to.have.members(allFiles);
            expect(globby.sync(srcGlob).length).to.eql(2);
            expect(globby.sync(dstGlob).length).to.eql(0);

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
            process.argv = [process.execPath, 'mvjs.js', '--verbose', srcGlob, dstGlob];
            mvjs.run();
            // Verify that verbose mode printout was performed...
            expect(console.log.withArgs(`Renamed \x1b[37;1m${srcFiles[0]}\x1b[0m to \x1b[37;1m${dstGlob}\x1b[0m`).calledOnce).to.be.true;
            expect(globby.sync(dstGlob).length).to.eql(1);
            // Second source file should NOT be renamed as destination file already exists (due to rename of first source file)
            expect(globby.sync(srcGlob)).to.have.members([ srcFiles[1] ]);
            expect(console.log.withArgs(`Skipping rename of '${srcFiles[1]}': '${dstGlob}' already exists.`).calledOnce).to.be.true;
            expect(globby.sync(starGlob).length).to.eql(allFiles.length);
            expect(globby.sync(starGlob)).to.not.have.members(allFiles);
            expect(console.log.withArgs(`\x1b[36mRenamed 1 file(s)\x1b[0m`).calledOnce).to.be.true;
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

            process.argv = [process.execPath, 'mvjs.js', '--simulate', srcGlob, dstGlob];
            mvjs.run();
            expect(console.log.withArgs(`[Simulate] Renamed \x1b[37;1m${srcFiles[0]}\x1b[0m to \x1b[37;1m${newFilenames[0]}\x1b[0m`).calledOnce).to.be.true;
            expect(console.log.withArgs(`[Simulate] Renamed \x1b[37;1m${srcFiles[1]}\x1b[0m to \x1b[37;1m${newFilenames[1]}\x1b[0m`).calledOnce).to.be.true;
            expect(console.log.lastCall.calledWith(`[Simulate] \x1b[36mRenamed 2 file(s)\x1b[0m`)).to.be.true;

            // Case where destination path is different than source path
            srcGlob = path.join(TEST_PATH, 'dotdotnames1.z..');
            srcFiles = globby.sync(srcGlob);
            dstGlob = path.join('test', 'test-data2', 'dotdotnames2.z..');
            expect(srcFiles.length).to.eql(1);
            expect(globby.sync(dstGlob)).to.be.empty;
            process.argv = [process.execPath, 'mvjs.js', '--simulate', srcGlob, dstGlob];
            mvjs.run();
            expect(console.log.withArgs(`[Simulate] Renamed \x1b[37;1m${srcFiles[0]}\x1b[0m to \x1b[37;1m${dstGlob}\x1b[0m`).calledOnce).to.be.true;
            expect(console.log.lastCall.calledWith(`[Simulate] \x1b[36mRenamed 1 file(s)\x1b[0m`)).to.be.true;

            // Case where destination has trailing path sep '/'
            // Rename to test/test-data2/bob should succeed
            srcGlob = path.join(TEST_PATH, '$$twodollars.js$$');
            srcFiles = globby.sync(srcGlob);
            expect(srcFiles.length).to.eql(1);
            dstGlob = path.join('test', 'test-data2', 'bob', '/');
            process.argv = [process.execPath, 'mvjs.js', '--simulate', srcGlob, dstGlob];
            mvjs.run();
            expect(console.log.withArgs(`[Simulate] Renamed \x1b[37;1m${srcFiles[0]}\x1b[0m to \x1b[37;1mtest/test-data2/bob\x1b[0m`).calledOnce).to.be.true;
            expect(console.log.lastCall.calledWith(`[Simulate] \x1b[36mRenamed 1 file(s)\x1b[0m`)).to.be.true;

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
            process.argv = [process.execPath, 'mvjs.js', '--simulate', srcGlob, dstGlob];
            mvjs.run();
            expect(console.log.withArgs(`[Simulate] Skipping rename of '${srcGlob}': '${dstGlob}' already exists.`).calledOnce).to.be.true;
            expect(console.log.lastCall.calledWith(`[Simulate] \x1b[36mRenamed 0 file(s)\x1b[0m`)).to.be.true;

            // Case where multiple renames use the same destination filename.
            srcGlob = path.join(TEST_PATH, '*.JPEG');
            let srcFiles = globby.sync(srcGlob);
            dstGlob = path.join(TEST_PATH, 'newName.jpg');
            process.argv = [process.execPath, 'mvjs.js', '--simulate', srcGlob, dstGlob];
            mvjs.run();
            expect(console.log.withArgs(`[Simulate] Renamed \x1b[37;1m${srcFiles[0]}\x1b[0m to \x1b[37;1m${dstGlob}\x1b[0m`).calledOnce).to.be.true;
            expect(console.log.withArgs(`[Simulate] Skipping rename of '${srcFiles[1]}': '${dstGlob}' already exists.`).calledOnce).to.be.true;
            expect(console.log.lastCall.calledWith(`[Simulate] \x1b[36mRenamed 1 file(s)\x1b[0m`)).to.be.true;

            // Case where destination has trailing path sep '/'
            // Rename should fail because 'test/test-data2' (trailing '/' is omitted) already exists.
            srcGlob = path.join(TEST_PATH, '^^twocarets.hi^^');
            srcFiles = globby.sync(srcGlob);
            dstGlob = path.join('test', 'test-data2', '/');
            expect(srcFiles.length).to.eql(1);
            process.argv = [process.execPath, 'mvjs.js', '--simulate', srcGlob, dstGlob];
            mvjs.run();
            expect(console.log.withArgs(`[Simulate] Skipping rename of '${srcFiles[0]}': 'test/test-data2' already exists.`).calledOnce).to.be.true;
            expect(console.log.lastCall.calledWith(`[Simulate] \x1b[36mRenamed 0 file(s)\x1b[0m`)).to.be.true;

            // Case where destination path does not exist
            srcGlob = path.join(TEST_PATH, '*.JS');
            dstGlob = path.join('test', 'newpath', '*.es6');
            expect(globby.sync(srcGlob).length).to.eql(2);
            expect(fs.existsSync(path.join('test', 'newpath'))).to.be.false;
            process.argv = [process.execPath, 'mvjs.js', '--simulate', srcGlob, dstGlob];
            mvjs.run();
            expect(console.log.calledWith(sinon.match('[Simulate] No such file or directory'))).to.be.true;
            expect(console.log.lastCall.calledWith(`[Simulate] \x1b[36mRenamed 0 file(s)\x1b[0m`)).to.be.true;
            expect(fs.existsSync(path.join('test', 'newpath'))).to.be.false;

            // Case where source is not found
            srcGlob = path.join(TEST_PATH, '*.doc');
            dstGlob = path.join(TEST_PATH, '*.pdf');
            expect(globby.sync(srcGlob)).to.be.empty;
            process.argv = [process.execPath, 'mvjs.js', '--simulate', srcGlob, dstGlob];
            mvjs.run();
            expect(console.log.calledWith(sinon.match('[Simulate] File not found'))).to.be.true;
            expect(console.log.lastCall.calledWith(`[Simulate] \x1b[36mRenamed 0 file(s)\x1b[0m`)).to.be.false;

            // No file has changed in simulate mode
            expect(globby.sync(starGlob)).to.have.members(allFiles);
            expect(globby.sync(starGlob).length).to.eql(allFiles.length);
            expect(globby.sync(path.join('test', 'test-data2', '*'))).to.be.empty;
        });

        it('should ask for confirmation for each operation, when in --interactive mode', function () {
            let srcGlob = path.join(TEST_PATH, '*.js');
            let dstGlob = path.join(TEST_PATH, '*.old');

            // Disable Mocha timeouts for this test
            this.timeout(0);
            sinon.spy(readlineSync, 'keyInYN');
            process.argv = [process.execPath, 'mvjs.js', '--interactive', srcGlob, dstGlob];
            mvjs.run();
            expect(readlineSync.keyInYN.calledTwice).to.be.true;
            expect(console.log.lastCall.calledWith(sinon.match(`Renamed`))).to.be.true;
            readlineSync.keyInYN.restore();
        });

        /* ----------------------------------------------------- */
        /* ------------ before() and after() section ----------- */
        /* ----------------------------------------------------- */
        beforeEach(function () {
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
            mockFs({
                'test/test-data' : folderContent,
                'test/test-data2': {}
            });

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
