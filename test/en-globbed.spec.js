var expect    = require('chai').expect;
var sinon   = require('sinon');

var englobbed   = require('../src/en-globbed');

describe('When * wildcard matches multiple characters,', function () {
    describe('englobbed', function () {
        it('should return {type: "wildcard", pattern: *, match: "homer"}, when called w/ (path=["homer.js"], glob="*.js")', function () {
            let result = englobbed(['homer.js'], '*.js');
            expect(result[0][0]).to.eql({type: 'wildcard', pattern: '*', match: 'homer'});
        });

        it('should return {type: "wildcard", pattern: *, match: ".js"}, when called w/ (path=["homer.js"], glob="homer*")', function () {
            let result = englobbed(['homer.js'], 'homer*');
            expect(result[0][1]).to.eql({type: 'wildcard', pattern: '*', match: '.js'});
        });

        it('should return {type: "wildcard", pattern: *, match: "."}, when called w/ (path=["homer.js"], glob="homer*js")', function () {
            let result = englobbed(['homer.js'], 'homer*js');
            expect(result[0][1]).to.eql({type: 'wildcard', pattern: '*', match: '.'});
        });
    });
});

describe('When ** wildcard matches a single character,', function () {
   describe('englobbed', function () {
    it('should return {type: "wildcard", pattern: *, match: "h"}, when called w/ (path=["homer.js"], glob="**omer.js")', function () {
        let result = englobbed(['homer.js'], '**omer.js');
        expect(result[0][0]).to.eql({type: 'wildcard', pattern: '*', match: 'h'});
    });

    it('should return {type: "wildcard", pattern: *, match: "."}, when called w/ (path=["homer.js"], glob="homer**js")', function () {
        let result = englobbed(['homer.js'], 'homer**js');
        expect(result[0][1]).to.eql({type: 'wildcard', pattern: '*', match: '.'});
    });

    it('should return {type: "wildcard", pattern: *, match: "s"}, when called w/ (path=["homer.js"], glob="homer.j**")', function () {
        let result = englobbed(['homer.js'], 'homer.j**');
        expect(result[0][1]).to.eql({type: 'wildcard', pattern: '*', match: 's'});
    });

   });
});

describe('When ** wildcard matches no character,', function () {
    describe('englobbed', function () {
        it('should return {type: "wildcard", pattern: *, match: ""}, when called w/ (path=["homer.js"], glob="**homer.js")', function () {
            let result = englobbed(['homer.js'], '**homer.js');
            expect(result[0][0]).to.eql({type: 'wildcard', pattern: '*', match: ''});
        });

        it('should return {type: "wildcard", pattern: *, match: ""}, when called w/ (path=["homer.js"], glob="homer**.js")', function () {
            let result = englobbed(['homer.js'], 'homer**.js');
            expect(result[0][1]).to.eql({type: 'wildcard', pattern: '*', match: ''});
        });

        it('should return {type: "wildcard", pattern: *, match: ""}, when called w/ (path=["homer.js"], glob="homer.js**")', function () {
            let result = englobbed(['homer.js'], 'homer.js**');
            expect(result[0][1]).to.eql({type: 'wildcard', pattern: '*', match: ''});
        });
    });
});
