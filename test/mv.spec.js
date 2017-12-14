'use strict';

const path          = require('path');
const mockFs        = require('mock-fs');
const FilenameGen   = require('natural-filename-generator');
const TEST_PATH     = path.join('test', 'test-data');

const expect        = require('chai').expect;
const sinon         = require('sinon');
const globby        = require('globby');

let Mv      = require('../src/mv');
let Parser  = require('../src/mv-parser');
let Renamer = require('../src/mv-renamer');
let Mover   = require('../src/mv-mover');

describe('mv', function () {
    describe('run()', function () {
        describe('invoked without prior call to init()', function () {
            it('should throw an Error', function () {
                let myMv = Mv.create();
                expect(myMv.run).to.throw();
            });
        });

        describe('invoked after init() called', function () {
            it('should use parser at provided init', function () {
                const srcGlob = path.join(TEST_PATH, '*.hi^^');
                const dstGlob = path.join(TEST_PATH, '*.a.b');
                process.argv = [process.execPath, 'ms.js', srcGlob, dstGlob];
                this.myMv.init(this.myParser);
                this.myMv.run();
                expect(this.myParser.resolve.called).to.be.true;
            });

            it('should use renamer provided at init', function () {
                const srcGlob = path.join(TEST_PATH, '*.tm$');
                const dstGlob = path.join(TEST_PATH, '*.js$$');
                process.argv = [process.execPath, 'ms.js', srcGlob, dstGlob];
                this.myMv.init(null, this.myRenamer);
                this.myMv.run();
                expect(this.myRenamer.computeName.called).to.be.true;
            });

            it('should use mover provided at init', function () {
                const srcGlob = path.join(TEST_PATH, '*.z..');
                const dstGlob = path.join(TEST_PATH, '*.tm$');
                process.argv = [process.execPath, 'ms.js', srcGlob, dstGlob];
                this.myMv.init(null, null, this.myMover);
                this.myMv.run();
                expect(this.myMover.commit.called).to.be.true;
            });

            it('should use defaults if none provided at init', function () {
                const srcGlob = path.join(TEST_PATH, '*.a.b');
                const dstGlob = path.join(TEST_PATH, '*.up^');
                process.argv = [process.execPath, 'ms.js', srcGlob, dstGlob];
                this.myMv.init();
                //Calls run() and asserts that nothing was thrown
                expect(this.myMv.run).to.not.throw();
            });

            it('should proceed renaming files based on globs specified on command line', function () {
                const srcGlob = path.join(TEST_PATH, '*.up^');
                const dstGlob = path.join(TEST_PATH, '*.z..');
                const dstFiles = globby.sync(dstGlob).concat(
                    globby.sync(srcGlob).map(function (filename) {
                        return filename.replace(/\.up\^$/, '.z..');
                }));

                process.argv = [process.execPath, 'ms.js', srcGlob, dstGlob];
                this.myMv.init();
                this.myMv.run();

                // Asserts that original filenames no longer present after rename
                expect(globby.sync(srcGlob)).to.be.empty;
                expect(globby.sync(dstGlob).length).to.eql(4);
                expect(globby.sync(dstGlob)).to.have.members(dstFiles);
            });

            /* ----------------------------------------------------- */
            /* ------------ before() and after() section ----------- */
            /* ----------------------------------------------------- */
            before(function () {
                this.myParser = Parser.create();
                this.myRenamer = Renamer.create();
                this.myMover = Mover.create();
                this.myMv = Mv.create();
            });

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

                // save original argv
                this.argv = process.argv;

                sinon.spy(this.myParser, "resolve");
                sinon.spy(this.myRenamer, "computeName");
                sinon.spy(this.myMover, "commit");
            });

            afterEach(function () {
                mockFs.restore();
                this.myParser.resolve.restore();
                this.myRenamer.computeName.restore();
                this.myMover.commit.restore();
                process.argv = this.argv;
            });
        });
    });
});
