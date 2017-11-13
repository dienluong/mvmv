'use strict';

const mockFs        = require('mock-fs');
const FilenameGen   = require('natural-filename-generator');
const path          = require('path');
const globby        = require('globby');

const expect        = require('chai').expect;
// const sinon         = require('sinon');

const mover         = require('../src/mv-mover');
const parser        = require('../src/mv-parser');
const TEST_PATH     = path.join('test', 'test-data');

describe('mv-mover', function () {
    describe('commit()', function () {
        it('should rename *.txt files to *.doc on file system', function () {
            let srcPattern  = path.join(TEST_PATH, '*.txt');
            let dstPattern  = path.join(TEST_PATH, '*.doc');
            let filesList   = this.myParser.resolve(srcPattern);
            let newFilesList = filesList.map(function (name) {
                return name.replace(/\.txt$/, ".doc");
            });

            let returned = this.myMover.commit(filesList, newFilesList);
            expect(globby.sync(srcPattern)).to.be.empty;
            expect(this.myParser.resolve(srcPattern)).to.be.empty;
            expect(globby.sync(dstPattern)).to.have.members(newFilesList);
            expect(this.myParser.resolve(dstPattern)).to.have.members(newFilesList);
            expect(this.myParser.resolve(dstPattern).length).to.eql(2);
            expect(returned).to.be.empty;
        });

        it('should return the indexes of names for which rename failed', function () {
            let filesList  = this.myParser.resolve(path.join(TEST_PATH, '*.js'));
            filesList.push('non-existing.file');
            filesList = filesList.concat(this.myParser.resolve(path.join(TEST_PATH, '*.JPEG')));
            expect(filesList.length).to.eql(5);
            let newFilesList = [path.join(TEST_PATH, '1.txt'),
                                path.join(TEST_PATH, '2.TXT'),
                                'existing.document',
                                path.join(TEST_PATH)];

            let returned = this.myMover.commit(filesList, newFilesList);
            // Renames failed:
            // [2] because original file does not exist
            // [3] because path without filename,
            // [4] because no corresponding item in new name array
            expect(returned).to.have.members([2, 3, 4]);
            expect(returned.length).to.eql(3);
        });

        // beforeEach(function () {
        //     var g = new FilenameGen();
        //
        //     // creates mock test folder and files
        //     mockFs({
        //            [g.generate('txt')] : 'created by mock-fs',
        //            [g.generate('txt')] : 'created by mock-fs',
        //            [g.generate('txt')] : 'created by mock-fs',
        //            [g.generate('TXT')] : 'created by mock-fs',
        //            [g.generate('TXT')] : 'created by mock-fs',
        //            [g.generate('TXT')] : 'created by mock-fs',
        //            [g.generate('jpg')] : 'created by mock-fs',
        //            [g.generate('JPG')] : 'created by mock-fs',
        //            [g.generate('jpeg')] : 'created by mock-fs',
        //            [g.generate('JPEG')] : 'created by mock-fs',
        //            [g.generate('png')] : 'created by mock-fs',
        //            [g.generate('gif')] : 'created by mock-fs',
        //            [g.generate('GIF')] : 'created by mock-fs',
        //            [g.generate('')] : 'created by mock-fs'
        //     });
        //
        //     this.myMover = mover.create();
        // });
        //
        // afterEach(function () {
        //     mockFs.restore();
        // });


        /* ----------------------------------------------------- */
        /* ------------ before() and after() section ----------- */
        /* ----------------------------------------------------- */
        before(function () {
            this.myMover    = mover.create();
            this.myParser   = parser.create();
            const g         = new FilenameGen();
            const extensions = ['txt', 'TXT', 'jpeg', 'JPEG', 'js', 'JS'];
            let folderContent = {};
            this.fullnamesMap = new Map();

            // Build a Map of all files.  Key is the file extension and value is an array of the filenames with that extension
            // Also builds the object "folderContent" for mock-fs
            for (let i = extensions.length - 1; i >= 0; i -= 1) {
                let names = [ path.join(TEST_PATH, g.generate(extensions[i])), path.join(TEST_PATH, g.generate(extensions[i])) ];
                this.fullnamesMap.set(extensions[i], names);
                Object.defineProperty(folderContent, path.basename(names[0]), {
                    enumerable: true,
                    value: 'created by mock-fs'
                });
                Object.defineProperty(folderContent, path.basename(names[1]), {
                    enumerable: true,
                    value: 'created by mock-fs'
                });
            }

            // Add peculiar filenames
            const specialNames = [ '^onecaret.up^', '^^onecaret.up^', '^twocarets.hi^^', '^^twocarets.hi^^',
                '$onedollar.tm$', '$$onedollar.tm$', '$twodollars.js$$', '$$twodollars.js$$',
                'dotnames1.a.b', 'dotnames2.a.b', 'dotdotnames1.z..', 'dotdotnames2.z..'];
            this.fullnamesMap.set('up^', [ path.join(TEST_PATH, specialNames[0]), path.join(TEST_PATH, specialNames[1]) ]);
            this.fullnamesMap.set('hi^^', [ path.join(TEST_PATH, specialNames[2]), path.join(TEST_PATH, specialNames[3]) ]);
            this.fullnamesMap.set('tm$', [ path.join(TEST_PATH, specialNames[4]), path.join(TEST_PATH, specialNames[5]) ]);
            this.fullnamesMap.set('js$$', [ path.join(TEST_PATH, specialNames[6]), path.join(TEST_PATH, specialNames[7]) ]);
            this.fullnamesMap.set('a.b', [ path.join(TEST_PATH, specialNames[8]), path.join(TEST_PATH, specialNames[9]) ]);
            this.fullnamesMap.set('z..', [ path.join(TEST_PATH, specialNames[10]), path.join(TEST_PATH, specialNames[11]) ]);
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
        });

        after(function () {
            mockFs.restore();
        });
    });
});
