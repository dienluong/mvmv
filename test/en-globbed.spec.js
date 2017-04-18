var expect    = require('chai').expect;
var sinon   = require('sinon');

var englobbed   = require('../src/en-globbed');

describe('When * wildcard matches multiple characters,', function () {
    describe('englobbed', function () {
        it('should return {wildcard: *, match: \"homer\"}, when called w/ (path=[\"homer.js\"], glob=\"*.js\")', function () {
            let result = englobbed(['homer.js'], '*.js');
            expect(result[0]).to.eql([{wildcard: '*', match: 'homer'}]);
        });

        it('should return {wildcard: *, match: \".js\"}, when called w/ (path=[\"homer.js\"], glob=\"homer*\")', function () {
            let result = englobbed(['homer.js'], 'homer*');
            expect(result[0]).to.eql([{wildcard: '*', match: '.js'}]);
        });

        it('should return {wildcard: *, match: \".\"}, when called w/ (path=[\"homer.js\"], glob=\"homer*js\")', function () {
            let result = englobbed(['homer.js'], 'homer*js');
            expect(result[0]).to.eql([{wildcard: '*', match: '.'}]);
        });
    });
});

describe('When ** wildcard matches a single character,', function () {
   describe('englobbed', function () {
    it('should return {wildcard: *, match: \"h\"}, when called w/ (path=[\"homer.js\"], glob=\"**omer.js\")', function () {
        let result = englobbed(['homer.js'], '**omer.js');
        expect(result[0]).to.eql([{wildcard: '*', match: 'h'}]);
    });

    it('should return {wildcard: *, match: \".\"}, when called w/ (path=[\"homer.js\"], glob=\"homer**js\")', function () {
        let result = englobbed(['homer.js'], 'homer**js');
        expect(result[0]).to.eql([{wildcard: '*', match: '.'}]);
    });

    it('should return {wildcard: *, match: \"s\"}, when called w/ (path=[\"homer.js\"], glob=\"homer.j**\")', function () {
        let result = englobbed(['homer.js'], 'homer.j**');
        expect(result[0]).to.eql([{wildcard: '*', match: 's'}]);
    });

   });
});

describe('When ** wildcard matches no character,', function () {
    describe('englobbed', function () {
        it('should return {wildcard: *, match: \"\"}, when called w/ (path=[\"homer.js\"], glob=\"**homer.js\")', function () {
            let result = englobbed(['homer.js'], '**homer.js');
            expect(result[0]).to.eql([{wildcard: '*', match: ''}]);
        });

        it('should return {wildcard: *, match: \"\"}, when called w/ (path=[\"homer.js\"], glob=\"homer**.js\")', function () {
            let result = englobbed(['homer.js'], 'homer**.js');
            expect(result[0]).to.eql([{wildcard: '*', match: ''}]);
        });

        it('should return {wildcard: *, match: \"\"}, when called w/ (path=[\"homer.js\"], glob=\"homer.js**\")', function () {
            let result = englobbed(['homer.js'], 'homer.js**');
            expect(result[0]).to.eql([{wildcard: '*', match: ''}]);
        });
    });
});
