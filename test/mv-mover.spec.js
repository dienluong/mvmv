'use strict';

const mockFs        = require('mock-fs');
const FilenameGen   = require('natural-filename-generator');
const path          = require('path').posix;
const fs            = require('fs');
const globby        = require('globby');

const expect        = require('chai').expect;
const sinon         = require('sinon');

const mover         = require('../src/mv-mover');
const parser        = require('../src/mv-parser');
const TEST_PATH     = path.join('test', 'test-data');

function blockSetup(mochaContext) {
    mochaContext.myMover    = mover.create();
    mochaContext.myParser   = parser.create();
    mochaContext.myCallback = function (err, old, nyou, idx) {
        if (err) {
            console.log(`From callback: Rename #${idx} ${err.message}`);
        }
        else {
            console.log(`From callback: Rename #${idx} ${old} to ${nyou}`);
        }
    };
}

describe('mv-mover', function () {
    before(function () {
        blockSetup(this);
    });

    describe('commit()', function () {
        it('should rename files on file system, and return an array of index of successful renames', function () {
            const srcPattern  = path.join(TEST_PATH, '*.txt');
            const dstPattern  = path.join(TEST_PATH, '*.doc');
            const filesList   = this.myParser.resolve(srcPattern);
            const newFilesList = filesList.map(function (name) {
                return name.replace(/\.txt$/, '.doc');
            });

            const returned = this.myMover.commit(filesList, newFilesList);
            // Cross-verification with globby, parser.resolve and fs.existsSync
            expect(globby.sync(srcPattern)).to.be.empty;
            expect(this.myParser.resolve(srcPattern)).to.be.empty;
            expect(globby.sync(dstPattern)).to.have.members(newFilesList);
            expect(this.myParser.resolve(dstPattern)).to.have.members(newFilesList);
            expect(this.myParser.resolve(dstPattern).length).to.eql(2);
            newFilesList.forEach(function (name) {
                expect(fs.existsSync(name)).to.be.true;
            });
            filesList.forEach(function (name) {
                expect(fs.existsSync(name)).to.be.false;
            });
            expect(returned.length).to.eql(2);
            expect(returned).to.have.members([0, 1]);
        });

        it('should invoke the callback if one is provided', function () {
            let filesList  = this.myParser.resolve(path.join(TEST_PATH, '*.JS'));
            filesList.push('non-existing.file');
            filesList.push(123);
            filesList = filesList.concat(this.myParser.resolve(path.join(TEST_PATH, '*.jpeg')));
            filesList = filesList.concat(this.myParser.resolve(path.join(TEST_PATH, '*.TXT')));
            expect(filesList.length).to.eql(8);
            let newFilesList = [path.join(TEST_PATH, '1.jav'),
                path.join(TEST_PATH, '2.JAV'),
                'existing.document',
                'file.123',
                path.join(TEST_PATH),
                789,
                'success.new'];

            sinon.spy(this, 'myCallback');

            const returned = this.myMover.commit(filesList, newFilesList, null, this.myCallback);
            // Renames success: [0, 1, 6]
            expect(returned.length).to.eql(3);
            expect(returned).to.have.members([0, 1, 6]);
            expect(this.myCallback.callCount).to.eql(8);
            // Renames failed: [2, 3, 4, 5, 7]
            this.myCallback.args.forEach(function (arg, idx) {
                switch (idx) {
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 7:
                        // For rename failures #2, 3, 4, 5 and 7, callback should be called with Error as first argument
                        expect(arg[0]).to.be.instanceof(Error);
                        break;
                    default:
                        // For rename success cases...
                        expect(arg[0]).to.be.null;
                }
            });

            this.myCallback.restore();
        });

        it('should handle gracefully non-function passed as callback', function () {
            let filesList    = this.myParser.resolve(path.join(TEST_PATH, '*.up^'));
            let newFilesList = [];

            expect(filesList.length).to.eql(2);
            for (let i = filesList.length - 1; i >= 0; i -= 1) {
                newFilesList.unshift(`${i}.up`);
            }
            // A Number as the callback
            let returned = this.myMover.commit(filesList, newFilesList, null, 123);
            expect(returned).to.have.members([0, 1]);

            filesList = this.myParser.resolve(path.join(TEST_PATH, '*.tm$'));
            expect(filesList.length).to.eql(2);
            newFilesList.length = 0;
            for (let i = filesList.length - 1; i >= 0; i -= 1) {
                newFilesList.unshift(`${i}.tm`);
            }
            // A String as the callback
            returned = this.myMover.commit(filesList, newFilesList, null, '123');
            expect(returned).to.have.members([0, 1]);

            filesList = this.myParser.resolve(path.join(TEST_PATH, '*.z..'));
            expect(filesList.length).to.eql(2);
            newFilesList.length = 0;
            for (let i = filesList.length - 1; i >= 0; i -= 1) {
                newFilesList.unshift(`${i}.z`);
            }
            // An array as the callback
            returned = this.myMover.commit(filesList, newFilesList, null, [123]);
            expect(returned).to.have.members([0, 1]);
        });

        it('should return an [] of indexes of names for which rename succeeded', function () {
            let filesList  = this.myParser.resolve(path.join(TEST_PATH, '*.js'));
            filesList.push('non-existing.file');
            filesList.push(123);
            filesList = filesList.concat(this.myParser.resolve(path.join(TEST_PATH, '*.JPEG')));
            filesList = filesList.concat(this.myParser.resolve(path.join(TEST_PATH, '*.TXT')));
            expect(filesList.length).to.eql(8);
            let newFilesList = [path.join(TEST_PATH, '1.jav'),
                path.join(TEST_PATH, '2.JAV'),
                'existing.document',
                'file.123',
                path.join(TEST_PATH),
                789,
                'success.new'];

            let returned = this.myMover.commit(filesList, newFilesList);
            // Renames:
            // [0] success
            // [1] success
            // [2] failed because original file does not exist
            // [3] failed because original file name is not a string (e.g. number 123)
            // [4] failed because new filename is a path without filename,
            // [5] failed because new file name is not a string (e.g. number 789)
            // [6] success
            // [7] failed because no corresponding new name in array
            expect(returned).to.have.members([0, 1, 6]);
            expect(returned.length).to.eql(3);

            // should work when destination path exists but is different than source path
            filesList = this.myParser.resolve(path.join(TEST_PATH, '*.jpeg'));
            newFilesList = [ path.join('test', 'test-data2', path.basename(filesList[0])), path.join('test', 'test-data2', path.basename(filesList[1])) ];
            returned = this.myMover.commit(filesList, newFilesList);
            expect(returned.length).to.eql(2);

            // should work when destination name has trailing '/' (it will be omitted)
            filesList = this.myParser.resolve(path.join(TEST_PATH, '$twodollars.js$$'));
            newFilesList = [ path.join('test', 'test-data2', 'abc', '/') ];
            returned = this.myMover.commit(filesList, newFilesList);
            expect(returned.length).to.eql(1);
            filesList = this.myParser.resolve(path.join('test', 'test-data2', 'abc'));
            expect(filesList).to.have.members([ 'test/test-data2/abc' ]);
        });

        it('should return empty [] if no successful rename completed', function () {
            let src = [ path.join(TEST_PATH, 'missing.file') ];
            let dest = [ path.join(TEST_PATH, 'a.file')];

            let returned = this.myMover.commit(src, dest);
            expect(returned).to.be.empty;

            // Following commit should fail because destination path does not exist
            src = globby.sync(path.join(TEST_PATH, '*.jpeg'));
            dest = [ path.join('test', 'new-test', path.basename(src[0])), path.join('test', 'new-test', path.basename(src[1])) ];
            returned = this.myMover.commit(src, dest);
            expect(returned).to.be.empty;
        });

        it('should not overwrite existing files', function () {
            let srcGlob = path.join(TEST_PATH, 'dotnames?.a.b');
            let filesList = globby.sync(srcGlob);
            let starGlob = path.join(TEST_PATH, '*');
            let allFiles = globby.sync(starGlob);
            let newFilename = path.join(TEST_PATH, 'dotnames.a.b.old');
            let newFilesList = [ newFilename, newFilename ];

            // filesList should contain two files: 'dotnames1.a.b' and 'dotnames2.a.b'
            expect(filesList.length).to.eql(2);
            // currently no file having the new filename.
            expect(globby.sync(newFilename).length).to.eql(0);

            let returned = this.myMover.commit(filesList, newFilesList, null, this.myCallback);
            // Expects only one successful rename attempt
            expect(returned).to.eql([0]);
            expect(globby.sync(srcGlob)).to.have.members([ path.join(TEST_PATH, 'dotnames2.a.b') ]);
            expect(globby.sync(newFilename)).to.have.members([ path.join(TEST_PATH, 'dotnames.a.b.old') ]);
            expect(globby.sync(starGlob).length).to.eql(allFiles.length);
            expect(globby.sync(starGlob)).to.not.have.members(allFiles);

            // trailing '/' in destination name will be omitted
            // So this rename will fail because destination already exists
            filesList = this.myParser.resolve(path.join(TEST_PATH, '$$onedollar.tm$'));
            newFilesList = [ path.join(TEST_PATH, '^^twocarets.hi^^', '/') ];
            returned = this.myMover.commit(filesList, newFilesList);
            expect(returned.length).to.eql(0);
            filesList = this.myParser.resolve(path.join(TEST_PATH, '$$onedollar.tm$'));
            expect(filesList.length).to.eql(1);
        });

        it('should throw a TypeError if invalid argument type passed', function () {
            sinon.spy(this.myMover, 'commit');

            // Invalid param type: number
            try {
                this.myMover.commit(123, ['somefile.name']);
            }
            catch (e) {
                expect(e).to.be.instanceof(TypeError)
                    .and.have.property('message', 'Expects arrays of old and new names.');
            }

            try {
                this.myMover.commit(['somefile.name'], 345);
            }
            catch (e) {
                expect(e).to.be.instanceof(TypeError)
                    .and.have.property('message', 'Expects arrays of old and new names.');
            }

            // Invalid param type: string
            try {
                this.myMover.commit('oldfilename.txt', ['somefile.name']);
            }
            catch (e) {
                expect(e).to.be.instanceof(TypeError)
                    .and.have.property('message', 'Expects arrays of old and new names.');
            }

            try {
                this.myMover.commit(['afile.name'], 'another.name');
            }
            catch (e) {
                expect(e).to.be.instanceof(TypeError)
                    .and.have.property('message', 'Expects arrays of old and new names.');
            }

            // Invalid param type: Non-array object
            try {
                this.myMover.commit({}, ['somefile.name']);
            }
            catch (e) {
                expect(e).to.be.instanceof(TypeError)
                    .and.have.property('message', 'Expects arrays of old and new names.');
            }

            try {
                this.myMover.commit(['somefile.name'], {});
            }
            catch (e) {
                expect(e).to.be.instanceof(TypeError)
                    .and.have.property('message', 'Expects arrays of old and new names.');
            }

            // Invalid param type: boolean
            try {
                this.myMover.commit(true, ['somefile.name']);
            }
            catch (e) {
                expect(e).to.be.instanceof(TypeError)
                    .and.have.property('message', 'Expects arrays of old and new names.');
            }

            try {
                this.myMover.commit(['somefile.name'], false);
            }
            catch (e) {
                expect(e).to.be.instanceof(TypeError)
                    .and.have.property('message', 'Expects arrays of old and new names.');
            }

            // Invalid number of params
            try {
                this.myMover.commit(['afile.name']);
            }
            catch (e) {
                expect(e).to.be.instanceof(TypeError)
                    .and.have.property('message', 'Expects arrays of old and new names.');
            }

            expect(this.myMover.commit.alwaysThrew('TypeError')).to.be.true;

            this.myMover.commit.restore();
        });
    });

    describe('commitAsync()', function () {
        before(function () {
            blockSetup(this);
        });

        it('should return a Promise', function (done) {
            let filesList    = this.myParser.resolve(path.join(TEST_PATH, '*.up^'));
            let newFilesList = filesList.map(e => `${e}.up`);
            expect(filesList.length).to.eql(2);

            let returned = this.myMover.commitAsync(filesList, newFilesList);
            expect(returned).to.be.instanceof(Promise);
            returned.then().catch();
            returned = this.myMover.commitAsync();
            expect(returned).to.be.instanceof(Promise);
            returned.then(() => done()).catch(() => done());
        });

        it('should return a rejected Promise if invalid arguments passed', function (done) {
            let filesList    = this.myParser.resolve(path.join(TEST_PATH, '*.up^'));
            let newFilesList = filesList.map(e => `${e}.up`);
            expect(filesList.length).to.eql(2);

            // For each Promise returned by commitAsync, if it rejects then we return a resolved Promise.
            let returnedPromises = [
                this.myMover.commitAsync(filesList, 1234).catch(() => Promise.resolve('test passed')),
                this.myMover.commitAsync(filesList, '124').catch(() => Promise.resolve('test passed')),
                this.myMover.commitAsync(filesList, true).catch(() => Promise.resolve('test passed')),
                this.myMover.commitAsync(filesList, {}).catch(() => Promise.resolve('test passed')),
                this.myMover.commitAsync(filesList).catch(() => Promise.resolve('test passed')),
                this.myMover.commitAsync(5467, newFilesList).catch(() => Promise.resolve('test passed')),
                this.myMover.commitAsync('564', newFilesList).catch(() => Promise.resolve('test passed')),
                this.myMover.commitAsync(true, newFilesList).catch(() => Promise.resolve('test passed')),
                this.myMover.commitAsync({}, newFilesList).catch(() => Promise.resolve('test passed')),
            ];

            Promise.all(returnedPromises)
                .then(results => {
                    results.every(res => res === 'test passed') ? done() : done(new Error('test failed'));
                })
                .catch(err => {
                    err instanceof Error ? done(err) : done(new Error(err));
                });
        });

        it('should, on successful move, return a Promise resolving to number of files successfully moved', async function () {
            const srcPattern  = path.join(TEST_PATH, '*.txt');
            const dstPattern  = path.join(TEST_PATH, '*.doc');
            const filesList   = this.myParser.resolve(srcPattern);
            const newFilesList = filesList.map(function (name) {
                return name.replace(/\.txt$/, '.doc');
            });

            try {
                const resolved = await this.myMover.commitAsync(filesList, newFilesList);
                // Cross-verification of the file move operation using globby, parser.resolve and fs.existsSync
                expect(globby.sync(srcPattern)).to.be.empty;
                expect(this.myParser.resolve(srcPattern)).to.be.empty;
                expect(globby.sync(dstPattern)).to.have.members(newFilesList);
                expect(this.myParser.resolve(dstPattern)).to.have.members(newFilesList);
                expect(this.myParser.resolve(dstPattern).length).to.eql(newFilesList.length);
                newFilesList.forEach(function (name) {
                    expect(fs.existsSync(name)).to.be.true;
                });
                filesList.forEach(function (name) {
                    expect(fs.existsSync(name)).to.be.false;
                });

                // the number of files successfully moved should equal to the number of globbed files
                expect(resolved).to.eql(filesList.length);
            }
            catch(err) {
                console.log(err);
                expect.fail(err, filesList.length, 'should not throw');
            }
        });

        it('should, when target already exist, return Promise rejected to array of Error in relevant slots', async function () {
            const srcPattern  = path.join(TEST_PATH, '*.txt');
            const dstPattern  = path.join(TEST_PATH, '*.txt');
            const filesList   = this.myParser.resolve(srcPattern);
            let success = false;

            try {
                // filesList contains two files and renaming them to the same file name will fail.
                await this.myMover.commitAsync(filesList, filesList);
            }
            catch(rejected) {
                // Cross-verification of the file move operation using globby, parser.resolve and fs.existsSync
                expect(globby.sync(srcPattern)).to.be.not.empty;
                expect(this.myParser.resolve(srcPattern)).to.be.not.empty;
                expect(globby.sync(dstPattern)).to.have.members(filesList);
                expect(this.myParser.resolve(dstPattern)).to.have.members(filesList);
                expect(this.myParser.resolve(dstPattern).length).to.eql(filesList.length);
                filesList.forEach(function (name) {
                    expect(fs.existsSync(name)).to.be.true;
                });

                expect(rejected.length).to.eql(filesList.length);
                expect(rejected.every(e => e instanceof Error)).to.be.true;
                success = true;
            }
            finally {
                !success ? expect.fail(null, null, 'should not resolve') : true;
            }
        });

        it('should, when source does not exist, return Promise rejected to array of Error in relevant slots', async function () {
            let success = false;
            const srcPattern  = path.join(TEST_PATH, '*.txt');
            const dstPattern  = path.join(TEST_PATH, '*.doc');
            const filesList   = this.myParser.resolve(srcPattern);
            filesList.push('invalid_dir/non-existent_file1.txt');
            filesList.push('invalid_dir/non-existent_file2.txt');
            const newFilesList = filesList.map(function (name) {
                return name.replace(/\.txt$/, '.doc');
            });

            try {
                // the last two filenames in filesList do not exist
                await this.myMover.commitAsync(filesList, newFilesList);
            }
            catch(rejected) {
                // Cross-verification of the file move operation using globby, parser.resolve and fs.existsSync
                expect(globby.sync(srcPattern)).to.be.empty;
                expect(this.myParser.resolve(srcPattern)).to.be.empty;
                expect(newFilesList).to.include.members(globby.sync(dstPattern));
                expect(newFilesList).to.include.members(this.myParser.resolve(dstPattern));
                expect(this.myParser.resolve(dstPattern).length).to.eql(2);
                filesList.forEach(function (name) {
                    expect(fs.existsSync(name)).to.be.false;
                });

                expect(rejected.length).to.eql(filesList.length);
                // The move of first two files should be successful, therefore their slots should contain null
                // The move of last two files should fail because source files are non-existent
                expect(rejected[0]).to.be.null;
                expect(rejected[1]).to.be.null;
                expect(rejected[2]).to.be.instanceof(Error);
                expect(rejected[3]).to.be.instanceof(Error);
                success = true;
            }
            finally {
                !success ? expect.fail(null, null, 'should not resolve') : true;
            }
        });
    });

    /* ----------------------------------------------------- */
    /* ------------ beforeEach() and afterEach() section ----------- */
    /* ----------------------------------------------------- */
    beforeEach(function () {
        const g         = new FilenameGen();
        const extensions = ['txt', 'TXT', 'jpeg', 'JPEG', 'js', 'JS'];
        let folderContent = {};

        // Build the object "folderContent" for mock-fs;
        // for each extension, generate two files
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

        // Add peculiar filenames
        const specialNames = [ '^onecaret.up^', '^^onecaret.up^', '^twocarets.hi^^', '^^twocarets.hi^^',
            '$onedollar.tm$', '$$onedollar.tm$', '$twodollars.js$$', '$$twodollars.js$$',
            'dotnames1.a.b', 'dotnames2.a.b', 'dotdotnames1.z..', 'dotdotnames2.z..'];
        specialNames.forEach(function (name) {
            Object.defineProperty(folderContent, name, {
                enumerable: true,
                value: 'created by mock-fs'
            });
        });

        // creates mock test folder and files
        mockFs({
            'test/test-data': folderContent,
            'test/test-data2': {}
        });
    });

    afterEach(function () {
        mockFs.restore();
    });
});
