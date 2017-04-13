var mockFs  = require('mock-fs');
var filenameGen = require('natural-filename-generator');
var globby  = require('globby');
var path    = require('path');

var expect  = require('chai').expect;
var sinon   = require('sinon');

var Parser  = require('../src/mv-parser');

describe('mv-parser', function () {
    describe('resolve()', function () {
        it('should return [] when none matched', function () {
            let pattern = path.join('test', 'test-data', '*.bob');
            let result = this.parser.resolve(pattern);

            expect(this.parser.resolve.returned([])).to.be.true;
            expect(result).to.eql(globby.sync(pattern));
        });

        it('should return array of file names matching glob pattern', function () {
            let globPattern = path.join('test', 'test-data', '*.txt');
            let txtFileNames = globby.sync(globPattern);

            let result = this.parser.resolve(globPattern);
            expect(result).to.eql(txtFileNames);
        });

        before(function () {
            var g = new filenameGen();

            // creates mock test folder and files
            mockFs({
                'test/test-data': {
                    [g.generate('txt')] : 'created by mock-fs',
                    [g.generate('txt')] : 'created by mock-fs',
                    [g.generate('txt')] : 'created by mock-fs',
                    [g.generate('TXT')] : 'created by mock-fs',
                    [g.generate('TXT')] : 'created by mock-fs',
                    [g.generate('TXT')] : 'created by mock-fs',
                    [g.generate('jpg')] : 'created by mock-fs',
                    [g.generate('JPG')] : 'created by mock-fs',
                    [g.generate('jpeg')] : 'created by mock-fs',
                    [g.generate('JPEG')] : 'created by mock-fs',
                    [g.generate('png')] : 'created by mock-fs',
                    [g.generate('PNG')] : 'created by mock-fs',
                    [g.generate('gif')] : 'created by mock-fs',
                    [g.generate('GIF')] : 'created by mock-fs',
                    [g.generate('')] : 'created by mock-fs'
                }
            });
        });

        after(function () {
            mockFs.restore();
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
