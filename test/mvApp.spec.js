'use strict';

let mvApp           = require('../src/mvApp');

const path          = require('path');
const mockFs        = require('mock-fs');
const FilenameGen   = require('natural-filename-generator');
const TEST_PATH     = path.join('test', 'test-data');
const expect        = require('chai').expect;
const sinon         = require('sinon');
const globby        = require('globby');
let commander       = require('commander');

function reloadApp() {
    delete require.cache[ require.resolve('../src/mvApp') ];
    delete require.cache[ require.resolve('commander') ];
    mvApp       = require('../src/mvApp');
    commander   = require('commander');
}

describe('myApp', function () {
    describe('when arguments is not correct', function () {
        it('should display usage help info', function () {
            // Temporarily suppress output to stdout
            // let stdoutWriteStub = sinon.stub(process.stdout, 'write');
            // stdoutWriteStub.returns(true);

            process.argv = [process.execPath, 'mvApp.js'];
            reloadApp();
            sinon.spy(commander, 'outputHelp');
            mvApp.run();
            expect(commander.outputHelp.called).to.be.true;
            commander.outputHelp.restore();

            process.argv = [process.execPath, 'mvApp.js', 'a.file'];
            reloadApp();
            sinon.spy(commander, 'outputHelp');
            mvApp.run();
            expect(commander.outputHelp.called).to.be.true;
            commander.outputHelp.restore();

            process.argv = [process.execPath, 'mvApp.js', '--verbose'];
            reloadApp();
            sinon.spy(commander, 'outputHelp');
            mvApp.run();
            expect(commander.outputHelp.called).to.be.true;
            commander.outputHelp.restore();

            process.argv = [process.execPath, 'mvApp.js', '--simulate', 'a.file'];
            reloadApp();
            sinon.spy(commander, 'outputHelp');
            mvApp.run();
            expect(commander.outputHelp.called).to.be.true;
            commander.outputHelp.restore();

            process.argv = [process.execPath, 'mvApp.js', '--interaktiv', path.join(TEST_PATH, '*.jpeg'), path.join(TEST_PATH, '*.jpg')];
            reloadApp();
            sinon.spy(commander, 'outputHelp');
            mvApp.run();
            expect(commander.outputHelp.called).to.be.true;
            commander.outputHelp.restore();

            // Valid command line, usage info should not be displayed
            process.argv = [process.execPath, 'mvApp.js', path.join(TEST_PATH, '*.jpeg'), path.join(TEST_PATH, '*.jpg')];
            reloadApp();
            sinon.spy(commander, 'outputHelp');
            mvApp.run();
            expect(commander.outputHelp.called).to.be.false;
            commander.outputHelp.restore();

            reloadApp();

            // process.stdout.write.restore();
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

            // Simulate command: node mvApp.js <src> <dst>
            process.argv = [process.execPath, 'mvApp.js', srcGlob, dstGlob];
            mvApp.run();
            expect(globby.sync(srcGlob).length).to.eql(0);
            expect(globby.sync(dstGlob).length).to.eql(4);
            expect(globby.sync(starGlob).length).to.eql(allFiles.length);
            expect(globby.sync(starGlob)).to.not.have.members(allFiles);
        });

        it('should display message if no source file found', function () {
            let starGlob = path.join(TEST_PATH, '*');
            let allFiles = globby.sync(starGlob);
            let srcGlob = path.join(TEST_PATH, '*.doc');
            let dstGlob = path.join(TEST_PATH, '*.pdf');
            expect(globby.sync(srcGlob).length).to.eql(0);
            expect(globby.sync(dstGlob).length).to.eql(0);

            sinon.spy(console, "log");
            process.argv = [process.execPath, 'mvApp.js', srcGlob, dstGlob];
            mvApp.run();
            expect(console.log.withArgs(`File not found.`).calledOnce).to.be.true;
            expect(globby.sync(starGlob)).to.have.members(allFiles);
            console.log.restore();
        });

        it('should display operations in --verbose mode', function () {
            let srcGlob = path.join(TEST_PATH, 'dotnames2.a.b');
            let dstGlob = path.join(TEST_PATH, 'dotnames2.a.b.old');
            let starGlob = path.join(TEST_PATH, '*');
            let allFiles = globby.sync(starGlob);
            let srcFiles = globby.sync(srcGlob);
            let dstFiles = globby.sync(dstGlob);

            expect(srcFiles.length).to.eql(1);
            expect(dstFiles.length).to.eql(0);
            sinon.spy(console, "log");
            process.argv = [process.execPath, 'mvApp.js', '--verbose', srcGlob, dstGlob];
            mvApp.run();
            // Verify that verbose mode printout was performed...
            expect(console.log.withArgs(`[Verbose]     Renaming \x1b[37;1m${srcGlob}\x1b[0m to \x1b[37;1m${dstGlob}\x1b[0m`).calledOnce).to.be.true;
            expect(globby.sync(srcGlob)).to.be.empty;
            expect(globby.sync(dstGlob).length).to.eql(1);
            expect(globby.sync(starGlob).length).to.eql(allFiles.length);
            expect(globby.sync(starGlob)).to.not.have.members(allFiles);
            console.log.restore();
        });

        it('should not change the file system in --simulate mode', function () {
            let srcGlob = path.join(TEST_PATH, '*js$$');
            let dstGlob = path.join(TEST_PATH, '*hi^^');
            const starGlob = path.join(TEST_PATH, '*');
            const allFiles = globby.sync(starGlob);

            process.argv = [process.execPath, 'mvApp.js', '--simulate', srcGlob, dstGlob];
            mvApp.run();

            // Case where destination file already exists.
            srcGlob = path.join(TEST_PATH, '^onecaret.up^');
            dstGlob = path.join(TEST_PATH, '^^onecaret.up^');
            process.argv = [process.execPath, 'mvApp.js', '--simulate', srcGlob, dstGlob];
            mvApp.run();

            expect(globby.sync(starGlob)).to.have.members(allFiles);
            expect(globby.sync(starGlob).length).to.eql(allFiles.length);
        });

        it.skip('should ask for confirmation for each operation in --interactive mode', function () {
            let srcGlob = path.join(TEST_PATH, '*');
            let dstGlob = path.join(TEST_PATH, '*.old');
            let starGlob = path.join(TEST_PATH, '*');
            let allFiles = globby.sync(starGlob);

            process.argv = [process.execPath, 'mvApp.js', '--interactive', srcGlob, dstGlob];
            mvApp.run();
            expect(globby.sync(starGlob)).to.not.have.members(allFiles);
            expect(globby.sync(starGlob).length).to.eql(allFiles.length);
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
                'test/test-data': folderContent
            });

            this.argv = process.argv;   // backs up argv
        });

        afterEach(function () {
            mockFs.restore();
            process.argv = this.argv;
        });
    });
});
