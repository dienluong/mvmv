var expect    = require('chai').expect;
var sinon   = require('sinon');

var englobbed   = require('../src/en-globbed');

describe('englobbed', function () {
    it('should return \"homer\" for wildcard *, when called w/ (path=[\"homer.js\"], glob=\"*.js\")', function () {
        let result = englobbed(['homer.js'], '*.js');

        expect(result[0]).to.eql([{wildcard: '*', match: 'homer'}]);
    });
});
