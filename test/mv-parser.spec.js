var mockFs  = require('mock-fs');
var filenameGen = require('natural-filename-generator');
var globby  = require('globby');
var path    = require('path');
var expect  = require('chai').expect;
var sinon   = require('sinon');
var myParser  = require('../src/mv-parser');

describe('mv-parser', function () {
    describe('resolve()', function () {
        before(function () {
            var g = new filenameGen();

            // creates mock test folder and files
            mockFs({
                'test/test-data': {
                    [g.generate('txt')] : 'created by mock-fs',
                    [g.generate('txt')] : 'created by mock-fs',
                    [g.generate('txt')] : 'created by mock-fs',
                    [g.generate('TXT')] : 'created by mock-fs',
                    [g.generate('jpg')] : 'created by mock-fs',
                    [g.generate('jpg')] : 'created by mock-fs',
                    [g.generate('JPG')] : 'created by mock-fs',
                    [g.generate('jpeg')] : 'created by mock-fs',
                    [g.generate('jpeg')] : 'created by mock-fs',
                    [g.generate('png')] : 'created by mock-fs',
                    [g.generate('png')] : 'created by mock-fs',
                    [g.generate('gif')] : 'created by mock-fs',
                    [g.generate('gif')] : 'created by mock-fs',
                    [g.generate('JPEG')] : 'created by mock-fs',
                    [g.generate('GIF')] : 'created by mock-fs',
                    [g.generate('')] : 'created by mock-fs'
                }
            });

            this.globPattern = path.join('test', 'test-data', '*.txt');
            this.txtFileNames = globby.sync(this.globPattern);
        });

        after(function () {
           mockFs.restore();
        });

        beforeEach(function () {
            this.parser = myParser.create();
            sinon.spy(this.parser, 'resolve');

        });

        afterEach(function () {
            this.parser.resolve.restore();
        });

        it('should return [] when none matched', function () {
            this.parser.resolve(path.join('test-data', '*.bob'));
            expect(this.parser.resolve.returned([])).to.be.true;
        });

        it('should return array of file names matching glob pattern', function () {
            var fileList = this.parser.resolve(this.globPattern);
            expect(fileList).to.eql(this.txtFileNames);
        });
    });
});
