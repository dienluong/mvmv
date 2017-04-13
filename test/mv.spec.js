// Mock fs core module
var mockFs = require('mock-fs');

var expect  = require('chai').expect;
var sinon   = require('sinon');

var Mv      = require('../src/mv');
var Parser  = require('../src/mv-parser');
var Mover   = require('../src/mv-mover');

describe('mv', function () {
    describe('init()', function () {
        beforeEach(function () {
            this.argv = process.argv;   // backs up argv
            process.argv = [process.execPath, 'ms.js', '*.txt', '*.jpg'];
        });

        afterEach(function () {
            process.argv = this.argv;
        });

        it('should use default parser if none provided', function () {
            let myMv = Mv.create();
            myMv.init();
            myMv.run();
            expect(myMv.run).to.not.throw(Error);
        })
    });

    describe('run()', function () {
        beforeEach(function () {
            this.argv = process.argv;   // backs up argv
            process.argv = [process.execPath, 'ms.js', '*.txt', '*.jpg'];

            this.myParser = Parser.create();
            this.myMover = Mover.create();
            this.mv = Mv.create();
            this.mv.init(this.myParser, this.myMover);

            sinon.spy(this.myMover, "move");
            sinon.spy(this.myParser, "resolve");
        });

        afterEach(function () {
           this.myParser.resolve.restore();
           this.myMover.move.restore();
           process.argv = this.argv;
        });

        it('should call parser.resolve() with 1st glob pattern from command line', function () {
            this.mv.run();
            expect(this.myParser.resolve.calledWith('*.txt')).to.be.true;
        });

        it('should call mover.move() with 2nd glob pattern from command line', function () {
            this.mv.run();
            expect(this.myMover.move.calledWith('*.jpg')).to.be.true;
        })
    });
});
