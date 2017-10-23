'use strict';

const MockFs    = require('mock-fs');
const Globby    = require('globby');
const fs        = require('fs');
const path      = require('path');
const FilenameGenerator = require('natural-filename-generator');

const expect  = require('chai').expect;
const sinon   = require('sinon');

const Parser  = require('../src/mv-parser');
const TEST_PATH = path.join('test', 'test-data');

describe('mv-parser', function () {
    describe('resolve()', function () {
        it('should return [] when none matched', function () {
            let pattern = path.join(TEST_PATH, '*.bob');
            let result = this.parser.resolve(pattern);
            expect(this.parser.resolve.returned([])).to.be.true;
            expect(result).to.eql(Globby.sync(pattern));
            expect(result).to.be.empty;

            pattern = '*.txt';
            result = this.parser.resolve(pattern);
            expect(this.parser.resolve.returned([])).to.be.true;
            expect(result).to.eql(Globby.sync(pattern));
            expect(result).to.be.empty;

            pattern = '*.txt/';
            result = this.parser.resolve(pattern);
            expect(this.parser.resolve.returned([])).to.be.true;
            expect(result).to.eql(Globby.sync(pattern));
            expect(result).to.be.empty;

            pattern = path.join('.', '*.JPEG');
            result = this.parser.resolve(pattern);
            expect(this.parser.resolve.returned([])).to.be.true;
            expect(result).to.be.eql(Globby.sync(pattern));
            expect(result).to.be.empty;
        });

        it('should return array of file names matching glob pattern', function () {
            // Test pattern "path/*.txt"
            let pattern = path.join(TEST_PATH, '*.txt');
            let result = this.parser.resolve(pattern);
            // Check with source array (fullnamesMap)
            let sourceNames = this.fullnamesMap.get('txt');
            expect(result).to.have.members(sourceNames);
            // Cross-check with result from another glob module: globby
            let globbyResult = Globby.sync(pattern);
            expect(result).to.eql(globbyResult);

            // Test pattern "path/*"
            pattern = path.join(TEST_PATH, '*');
            result = this.parser.resolve(pattern);
            // Note: Array.from returns an array of array; using Array.concat to flatten the arrays
            sourceNames = [].concat.apply([], Array.from(this.fullnamesMap.values()));
            expect(result).to.have.members(sourceNames);
            globbyResult = Globby.sync(pattern);
            expect(result).to.eql(globbyResult);
            result = result.map(function (res) {
                return path.basename(res);
            });
            expect(result).to.have.members(fs.readdirSync(TEST_PATH));

            // Test pattern "path/*.JP?G"
            pattern = path.join(TEST_PATH, '*.JP?G');
            result = this.parser.resolve(pattern);
            sourceNames = this.fullnamesMap.get('JPEG');
            expect(result).to.have.members(sourceNames);
            globbyResult = Globby.sync(pattern);
            expect(result).to.eql(globbyResult);

            // Test pattern "path/*.a.b
            pattern = path.join(TEST_PATH, '*.a.b');
            result = this.parser.resolve(pattern);
            sourceNames = this.fullnamesMap.get('a.b');
            expect(result).to.have.members(sourceNames);
            globbyResult = Globby.sync(pattern);
            expect(result).to.be.eql(globbyResult);

            // Test pattern "path/*.z..
            pattern = path.join(TEST_PATH, '*.z..');
            result = this.parser.resolve(pattern);
            sourceNames = this.fullnamesMap.get('z..');
            expect(result).to.have.members(sourceNames);
            globbyResult = Globby.sync(pattern);
            expect(result).to.be.eql(globbyResult);

            // Test pattern "path/*^
            pattern = path.join(TEST_PATH, '*^');
            result = this.parser.resolve(pattern);
            sourceNames = this.fullnamesMap.get('up^');
            sourceNames = sourceNames.concat(this.fullnamesMap.get('hi^^'));
            expect(result).to.have.members(sourceNames);
            globbyResult = Globby.sync(pattern);
            expect(result).to.be.eql(globbyResult);

            // Test pattern "path/^*.???
            pattern = path.join(TEST_PATH, '^*.???');
            result = this.parser.resolve(pattern);
            sourceNames = this.fullnamesMap.get('up^');
            expect(result).to.have.members(sourceNames);
            globbyResult = Globby.sync(pattern);
            expect(result).to.be.eql(globbyResult);

            // Test pattern "path/$$*.???$
            pattern = path.join(TEST_PATH, '$$*.???$');
            result = this.parser.resolve(pattern);
            sourceNames = [ path.join(TEST_PATH, '$$twodollars.js$$') ];
            expect(result).to.have.members(sourceNames);
            globbyResult = Globby.sync(pattern);
            expect(result).to.be.eql(globbyResult);

            // Test pattern "path/*.js*
            pattern = path.join(TEST_PATH, '*.js*');
            result = this.parser.resolve(pattern);
            sourceNames = this.fullnamesMap.get('js');
            sourceNames = sourceNames.concat(this.fullnamesMap.get('js$$'));
            expect(result).to.have.members(sourceNames);
            globbyResult = Globby.sync(pattern);
            expect(result).to.be.eql(globbyResult);
        });


        /* ----------------------------------------------------- */
        /* ------------ before() and after() section ----------- */
        /* ----------------------------------------------------- */
        before(function () {
            const g = new FilenameGenerator();
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
            MockFs({
                'test/test-data': folderContent
            });
        });

        after(function () {
            MockFs.restore();
        });

        beforeEach(function () {
            this.parser = Parser.create();
            sinon.spy(this.parser, 'resolve');

        });

        afterEach(function () {
            this.parser.resolve.restore();
        });
    });
});
