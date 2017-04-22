var expect    = require('chai').expect;
var sinon   = require('sinon');

var englobbed   = require('../src/en-globbed');

describe('When * wildcard matches multiple characters', function () {
    describe('englobbed', function () {
        it('should return {type: "wildcard", pattern: "*", match: <match>}', function () {
            let result = englobbed(['homer.js'], '*.js');
            expect(result[0][0]).to.eql({type: 'wildcard', pattern: '*', match: 'homer'});

            result = englobbed(['homer.js'], 'homer*');
            expect(result[0][1]).to.eql({type: 'wildcard', pattern: '*', match: '.js'});

            result = englobbed(['homer.js'], 'h*s');
            expect(result[0][1]).to.eql({type: 'wildcard', pattern: '*', match: 'omer.j'});
        });
    });
});

describe('When ** wildcard matches a single character', function () {
   describe('englobbed', function () {
       it('should return {type: "wildcard", pattern: "*", match: <matched_char>}', function () {
           let result = englobbed(['homer.js'], '**omer.js');
           expect(result[0][0]).to.eql({type: 'wildcard', pattern: '*', match: 'h'});

           result = englobbed(['homer.js'], 'homer**js');
           expect(result[0][1]).to.eql({type: 'wildcard', pattern: '*', match: '.'});

           result = englobbed(['homer.js'], 'homer.j**');
           expect(result[0][1]).to.eql({type: 'wildcard', pattern: '*', match: 's'});
       });
   });
});

describe('When ** wildcard matches no character', function () {
    describe('englobbed', function () {
        it('should return {type: "wildcard", pattern: "*", match: ""}', function () {
            let result = englobbed(['homer.js'], '**homer.js');
            expect(result[0][0]).to.eql({type: 'wildcard', pattern: '*', match: ''});

            result = englobbed(['homer.js'], 'homer**.js');
            expect(result[0][1]).to.eql({type: 'wildcard', pattern: '*', match: ''});

            result = englobbed(['homer.js'], 'homer.js**');
            expect(result[0][1]).to.eql({type: 'wildcard', pattern: '*', match: ''});
        });
    });
});

describe('When ? wildcard matches a character', function () {
    describe('englobbed', function () {
        it('should return {type: "wildcard", pattern: "?", match: <matched_char>}', function () {
            let result = englobbed(['homer.js'], '?omer.js');
            expect(result[0][0]).to.eql({type: 'wildcard', pattern: '?', match: 'h'});

            result = englobbed(['homer.js'], 'homer?js');
            expect(result[0][1]).to.eql({type: 'wildcard', pattern: '?', match: '.'});

            result = englobbed(['homer.js'], 'homer.j?');
            expect(result[0][1]).to.eql({type: 'wildcard', pattern: '?', match: 's'});
        });
    });
});

describe('When ? wildcard matches no character', function () {
    describe('englobbed', function () {
        it('should return empty array (i.e. no match)', function () {
            let result = englobbed(['homer.js'], '?homer.js');
            console.log(result);
            expect(result[0]).to.eql([]);
            result = englobbed(['homer.js'], 'homer.js?');
            expect(result[0]).to.eql([]);
            result = englobbed(['homer.js'], 'homer?.js');
            expect(result[0]).to.eql([]);
        });
    });
});


describe('When receiving multiple paths', function () {
    describe('englobbed', function () {
        it('should return a number of results matching number of paths received', function () {
            let result = englobbed(['marge.json', 'barney.txt'], '*.t?t');
            expect(result.length).to.equal(2);
        })
    });
});

describe('When receiving zero path', function () {
    describe('englobbed', function () {
        it('should return empty array', function () {
            let result = englobbed([], '*.ex?');
            expect(result.length).to.equal(0);
        })
    });
});


