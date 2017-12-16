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
    describe('exec()', function () {
        describe('invoked after init() called', function () {
            it('should use parser provided to init()', function () {
                const srcGlob = path.join(TEST_PATH, '*.hi^^');
                const dstGlob = path.join(TEST_PATH, '*.a.b');
                this.myMv.init(this.myParser);
                this.myMv.exec(srcGlob, dstGlob);
                expect(this.myParser.resolve.called).to.be.true;
            });

            it('should use renamer provided to init()', function () {
                const srcGlob = path.join(TEST_PATH, '*.tm$');
                const dstGlob = path.join(TEST_PATH, '*.js$$');
                this.myMv.init(null, this.myRenamer);
                this.myMv.exec(srcGlob, dstGlob);
                expect(this.myRenamer.computeName.called).to.be.true;
            });

            it('should use mover provided to init()', function () {
                const srcGlob = path.join(TEST_PATH, '*.z..');
                const dstGlob = path.join(TEST_PATH, '*.tm$');
                this.myMv.init(null, null, this.myMover);
                this.myMv.exec(srcGlob, dstGlob);
                expect(this.myMover.commit.called).to.be.true;
            });

            it('should use defaults if none provided to init()', function () {
                const srcGlob = path.join(TEST_PATH, '*.a.b');
                const dstGlob = path.join(TEST_PATH, '*.up^');
                this.myMv.init();
                //Calls exec() and asserts that nothing was thrown
                expect(() => this.myMv.exec(srcGlob, dstGlob)).to.not.throw();
            });
        });

        describe('invoked without prior init() call', function () {
            it('should use defaults', function () {
                const srcGlob = path.join(TEST_PATH, '*doc');
                const dstGlob = path.join(TEST_PATH, '*pdf');
                expect(() => this.myMv.exec(srcGlob, dstGlob)).to.not.throw();
            });

            it('should use objects provided to Mv.create()', function () {
                const srcGlob = path.join(TEST_PATH, '*txt');
                const dstGlob = path.join(TEST_PATH, '*TXT');
                const myParser   = Parser.create();
                const myRenamer  = Renamer.create();
                const myMover    = Mover.create();
                const myMv = Mv.create(myParser, myRenamer, myMover);

                sinon.spy(myParser, 'resolve');
                sinon.spy(myRenamer, 'computeName');
                sinon.spy(myMover, 'commit');

                expect(() => myMv.exec(srcGlob, dstGlob)).to.not.throw();
                expect(myParser.resolve.called).to.be.true;
                expect(myRenamer.computeName.called).to.be.true;
                expect(myMover.commit.called).to.be.true;
            });

            it('should throw an Error if no glob pattern provided', function () {
                expect(() => this.myMv.exec()).to.throw();
                expect(() => this.myMv.exec('abc')).to.throw();
                expect(() => this.myMv.exec('abc', [])).to.throw();
                expect(() => this.myMv.exec(123, '123')).to.throw();
                expect(() => this.myMv.exec('', '123')).to.throw();
                expect(() => this.myMv.exec('abc', '')).to.throw();
            });

            it('should proceed renaming files based on provided globs and return the number of successful renames', function () {
                const srcGlob = path.join(TEST_PATH, '*.up^');
                const dstGlob = path.join(TEST_PATH, '*.z..');
                const dstFiles = globby.sync(dstGlob).concat(
                    globby.sync(srcGlob).map(function (filename) {
                        return filename.replace(/\.up\^$/, '.z..');
                    }));

                const result = this.myMv.exec(srcGlob, dstGlob);

                // Asserts that original filenames no longer present after rename
                expect(globby.sync(srcGlob)).to.be.empty;
                expect(globby.sync(dstGlob).length).to.eql(4);
                expect(globby.sync(dstGlob)).to.have.members(dstFiles);
                expect(result).to.eql(2);
            });


            it.skip('should not change the file system, if --simulate/-s option specified', function () {
                const srcGlob = path.join(TEST_PATH, '*js$$');
                const dstGlob = path.join(TEST_PATH, '*hi^^');
                const srcFiles = globby.sync(srcGlob);
                const allFiles = globby.sync('*');

                // process.argv = [process.execPath, 'ms.js', '--simulate', srcGlob, dstGlob];

                this.myMv.exec(srcGlob, dstGlob);

                // Asserts that original filenames no longer present after rename
                expect(globby.sync(srcGlob)).to.have.members(srcFiles);
                expect(globby.sync('*')).to.have.members(allFiles);
            });
        });

        /* ----------------------------------------------------- */
        /* ------------ before() and after() section ----------- */
        /* ----------------------------------------------------- */
        before(function () {
            this.myParser   = Parser.create();
            this.myRenamer  = Renamer.create();
            this.myMover    = Mover.create();
            this.myMv       = Mv.create();
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

            sinon.spy(this.myParser, "resolve");
            sinon.spy(this.myRenamer, "computeName");
            sinon.spy(this.myMover, "commit");
        });

        afterEach(function () {
            mockFs.restore();
            this.myParser.resolve.restore();
            this.myRenamer.computeName.restore();
            this.myMover.commit.restore();
        });
    });
});
