var expect  = require('chai').expect;
var sinon   = require('sinon');
var mv      = require('../src/mv');
var myParser  = require('../src/mv-parser');

describe('mv', function () {
    describe('run()', function () {
        beforeEach(function () {
            this.argv = process.argv;   // backs up argv
            process.argv = [process.execPath, 'ms.js', '*.*', '*.jpg'];
            sinon.spy(myParser, "parse");
            this.mv = mv.create();
            this.mv.init(myParser);
        });

        afterEach(function () {
           myParser.parse.restore();
           process.argv = this.argv;
        });

        it('should call parser.parse() with glob patterns from command line', function () {
            this.mv.run();
            expect(myParser.parse.calledWith(['*.*', '*.jpg'])).to.be.true;
        });
    });
});
