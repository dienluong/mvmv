var expect  = require('chai').expect;
var sinon   = require('sinon');
var myParser  = require('../src/mv-parser');

describe('mv-parser', function () {
    describe('parse()', function () {
        beforeEach(function () {
            this.parser = myParser;
        });
        it('should accept only one * wildcard in glob pattern', function () {
            expect(this.parser.parse.bind(this.parser, 'node mv.js *.* *.jpg')).to.throw(Error);
        });
    });
});
