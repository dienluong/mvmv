var mockFs  = require('mock-fs');
var filenameGen = require('natural-filename-generator');
var path    = require('path');
var globby  = require('globby');

var expect    = require('chai').expect;
var sinon   = require('sinon');

var Mover   = require('../src/mv-mover');

describe('mv-mover', function () {
    describe('move()', function () {
       it('should rename *.txt files to *.doc', function () {
           let srcPattern = path.join('*.txt');
           let dstPattern = path.join('*.doc');
           let filesList = globby.sync(srcPattern);

           console.log(`filesList: ${filesList}`);

           let expectedList = filesList.map(function (name) {
              return name.replace(/\.txt$/, ".doc");
           });

           console.log(`expectedList: ${expectedList}`);

           this.myMover.move(filesList, srcPattern, dstPattern);

           expect(globby.sync(srcPattern)).to.be.empty;
           expect(globby.sync(dstPattern)).to.eql(expectedList);
       });

       beforeEach(function () {
           var g = new filenameGen();

           // creates mock test folder and files
           mockFs({
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
                   [g.generate('gif')] : 'created by mock-fs',
                   [g.generate('GIF')] : 'created by mock-fs',
                   [g.generate('')] : 'created by mock-fs'
           });

           this.myMover = Mover.create();
       });

       afterEach(function () {
           mockFs.restore();
       })
    });
});
