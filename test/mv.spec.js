var expect  = require('chai').expect;
var sinon   = require('sinon');
var Mv      = require('../src/mv');
var Parser  = require('../src/mv-parser');

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
            var myMv = Mv.create();
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
            sinon.spy(this.myParser, "resolve");
            this.mv = Mv.create();
            this.mv.init(this.myParser);
        });

        afterEach(function () {
           this.myParser.resolve.restore();
           process.argv = this.argv;
        });

        it('should call parser.resolve() with glob patterns from command line', function () {
            this.mv.run();
            expect(this.myParser.resolve.calledWith('*.txt')).to.be.true;
        });
    });
});
