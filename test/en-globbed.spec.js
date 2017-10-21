'use strict';

const expect    = require('chai').expect;
const sinon   = require('sinon');

const englobbed   = require('../src/en-globbed');

/*
 * ----------------------------------------------------------------------------------------------------
 * ------------------------------- Argument Handling Test Cases ---------------------------------------
 * ----------------------------------------------------------------------------------------------------
 */
describe('When receiving multiple paths', function () {
    describe('englobbed', function () {
        it('should return a number of results matching number of paths received', function () {
            let result = englobbed(['marge.json', 'barney.txt'], '*.t?t');
            // noinspection JSUnresolvedVariable
            expect(result.length).to.equal(2);

            result = englobbed(['marge.json', 'barney.txt', 'maggie.doc'], '?.js');
            // noinspection JSUnresolvedVariable
            expect(result.length).to.equal(3);

        });
    });
});

describe('When array of paths is empty', function () {
    describe('englobbed', function () {
        it('should return empty array', function () {
            let result = englobbed([], '*.ex?');
            expect(result).to.be.empty;
        });
    });
});

describe('When element in array of paths is not a string', function () {
    describe('englobbed', function () {
        it('should return empty array as result for that element', function () {
            let result = englobbed([12], '*.txt');
            expect(result[0]).to.be.an('object')
                .to.have.property('error');

            result = englobbed(['homer', {}], '?');
            expect(result[1]).to.be.an('object')
                .to.have.property('error');
        });
    });
});

describe('When first argument is not an array', function () {
    describe('englobbed', function () {
        beforeEach(function () {
            this.englobbed = englobbed;
            sinon.spy(this, 'englobbed');
        });

        afterEach(function () {
            this.englobbed.restore();
        });

        it('should throw a TypeError', function () {
            try {
                this.englobbed('bob', '*.js');
            }
            catch(e) {}

            try {
                this.englobbed(10, '*.txt');
            }
            catch(e) {}

            try {
                this.englobbed({}, '*.js');
            }
            catch(e) {}

            try {
                this.englobbed();
            }
            catch(e) {}

            expect(this.englobbed.alwaysThrew('TypeError')).to.be.true;
        });
    });
});

describe('When receiving other than a non-empty string as 2nd argument', function () {
    describe('englobbed', function () {
        beforeEach(function () {
            this.englobbed = englobbed;
            sinon.spy(this, 'englobbed');
        });

        afterEach(function () {
            this.englobbed.restore();
        });

        it('should throw a TypeError', function () {
            try {
                this.englobbed([], 2);
            }
            catch(e) {}

            try {
                this.englobbed([], '');
            }
            catch(e) {}

            try {
                this.englobbed([], []);
            }
            catch(e) {}

            try {
                this.englobbed([], {})
            }
            catch(e) {}

            try {
                this.englobbed([]);
            }
            catch(e) {}

            expect(this.englobbed.alwaysThrew('TypeError')).to.be.true;
        });
    });
});
/*
 * ----------------------------------------------------------------------------------
 * ------------------------- Test cases for * wildcard ------------------------------
 * ----------------------------------------------------------------------------------
 */
describe('When * wildcard matches multiple characters', function () {
    describe('englobbed', function () {
        it('should return in an array {type: "wildcard", pattern: "*", match: <matched_str>}', function () {
            let result = englobbed(['homer.js'], '*.js');
            expect(result[0][0]).to.eql({type: 'wildcard', pattern: '*', match: 'homer'});

            result = englobbed(['homer.js'], 'homer*');
            expect(result[0][1]).to.eql({type: 'wildcard', pattern: '*', match: '.js'});

            result = englobbed(['homer.js'], 'h*s');
            expect(result[0][1]).to.eql({type: 'wildcard', pattern: '*', match: 'omer.j'});
        });
    });
});

describe('When * wildcard matches a single character', function () {
   describe('englobbed', function () {
       it('should return in an array {type: "wildcard", pattern: "*", match: <matched_char>}', function () {
           let result = englobbed(['homer.js'], '*omer.js');
           expect(result[0][0]).to.eql({type: 'wildcard', pattern: '*', match: 'h'});

           result = englobbed(['homer.js'], 'homer*js');
           expect(result[0][1]).to.eql({type: 'wildcard', pattern: '*', match: '.'});

           result = englobbed(['homer.js'], 'homer.j*');
           expect(result[0][1]).to.eql({type: 'wildcard', pattern: '*', match: 's'});
       });
   });
});

describe('When * wildcard matches no character', function () {
    describe('englobbed', function () {
        it('should return in an array {type: "wildcard", pattern: "*", match: ""} because * "matches" zero or more characters', function () {
            let result = englobbed(['homer.js'], '*homer.js');
            expect(result[0][0]).to.eql({type: 'wildcard', pattern: '*', match: ''});

            result = englobbed(['homer.js'], 'homer*.js');
            expect(result[0][1]).to.eql({type: 'wildcard', pattern: '*', match: ''});

            result = englobbed(['homer.js'], 'homer.js*');
            expect(result[0][1]).to.eql({type: 'wildcard', pattern: '*', match: ''});
        });
    });
});

describe('When ** is specified', function () {
    describe('englobbed', function () {
        it('should treat ** like *, e.g. {type: "wildcard", pattern: "*", match: <matched_str>}', function () {
            let result = englobbed(['homer.js'], '**.js');
            expect(result[0][0]).to.eql({type: 'wildcard', pattern: '*', match: 'homer'});

            result = englobbed(['homer.js'], 'homer**js');
            expect(result[0][1]).to.eql({type: 'wildcard', pattern: '*', match: '.'});

            result = englobbed(['homer.js'], 'homer.js**');
            expect(result[0][1]).to.eql({type: 'wildcard', pattern: '*', match: ''});
        })
    })
});

/*
 * ------------------------------------------------------------------------------
 * ------------------- Tests cases for ? wildcard -------------------------------
 * ------------------------------------------------------------------------------
 */
describe('When ? wildcard matches one character', function () {
    describe('englobbed', function () {
        it('should return in an array {type: "wildcard", pattern: "?", match: <matched_char>}', function () {
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
            expect(result[0]).to.be.empty;

            result = englobbed(['homer.js'], 'homer.js?');
            expect(result[0]).to.be.empty;

            result = englobbed(['homer.js'], 'homer?.js');
            expect(result[0]).to.be.empty;
        });
    });
});

describe('When multiple ? wildcards are used', function () {
    describe('englobbed', function () {
        it('should return empty array (i.e. no match), if one or more ? have no match', function () {
            let result = englobbed(['homer.js'], '??omer.js');
            expect(result[0]).to.be.empty;

            result = englobbed(['homer.js'], 'homer.j??');
            expect(result[0]).to.be.empty;

            result = englobbed(['homer.js'], 'home??.js');
            expect(result[0]).to.be.empty;

            result = englobbed(['homer.js'], '??????????');
            expect(result[0]).to.be.empty;

            result = englobbed(['homer.js'], '?homer.js');
            expect(result[0]).to.be.empty;

            result = englobbed(['homer.js'], 'homer.js?');
            expect(result[0]).to.be.empty;
        });

        it('should return in an array {type: "wildcard", pattern: "?", match: <matched_char>} for each ?, if all of them have a match', function () {
            let result = englobbed(['homer.js'], 'ho?er?js');
            expect(result[0][1]).to.eql({type: 'wildcard', pattern: '?', match: 'm'});
            expect(result[0][3]).to.eql({type: 'wildcard', pattern: '?', match: '.'});

            result = englobbed(['homer.js'], '????????');
            expect(result[0][0]).to.eql({type: 'wildcard', pattern: '?', match: 'h'});
            expect(result[0][1]).to.eql({type: 'wildcard', pattern: '?', match: 'o'});
            expect(result[0][2]).to.eql({type: 'wildcard', pattern: '?', match: 'm'});
            expect(result[0][3]).to.eql({type: 'wildcard', pattern: '?', match: 'e'});
            expect(result[0][4]).to.eql({type: 'wildcard', pattern: '?', match: 'r'});
            expect(result[0][5]).to.eql({type: 'wildcard', pattern: '?', match: '.'});
            expect(result[0][6]).to.eql({type: 'wildcard', pattern: '?', match: 'j'});
            expect(result[0][7]).to.eql({type: 'wildcard', pattern: '?', match: 's'});
        })
    });
});

/*
 * --------------------------------------------------------------------------------------
 * ------------------------------- Test cases for literals ------------------------------
 * --------------------------------------------------------------------------------------
 */
describe('When the literal part is matched', function () {
    describe('englobbed', function () {
        it('should return in an array {type: "literal", pattern: <literal_str>, match: <matched_str>}', function () {
            let result = englobbed(['homer.js'], 'homer.js');
            expect(result[0][0]).to.eql({type: 'literal', pattern: 'homer.js', match: 'homer.js'});

            result = englobbed(['homer..js'], 'homer..js');
            expect(result[0][0]).to.eql({type: 'literal', pattern: 'homer..js', match: 'homer..js'});

            result = englobbed(['homer.js'], '*.js');
            expect(result[0][1]).to.eql({type: 'literal', pattern: '.js', match: '.js'});

            result = englobbed(['homer.js'], 'h**');
            expect(result[0][0]).to.eql({type: 'literal', pattern: 'h', match: 'h'});

            result = englobbed(['homer.js'], '*o*');
            expect(result[0][1]).to.eql({type: 'literal', pattern: 'o', match: 'o'});

            result = englobbed(['homer.js'], '?omer.??');
            expect(result[0][1]).to.eql({type: 'literal', pattern: 'omer.', match: 'omer.'});
        });
    });
});

describe('When the literal part has no match', function () {
    describe('englobbed', function () {
        it('should return an empty array', function () {
            let result = englobbed(['homer.js'], 'homar.js');
            expect(result[0]).to.be.empty;

            result = englobbed(['homer.js'], '*.j');
            expect(result[0]).to.be.empty;

            result = englobbed(['homer.js'], 'o*');
            expect(result[0]).to.be.empty;

            result = englobbed(['homer.js'], '*a*');
            expect(result[0]).to.be.empty;

            result = englobbed(['homer.js'], '*.');
            expect(result[0]).to.be.empty;

            result = englobbed(['homer.js'], '?omar.??');
            expect(result[0]).to.be.empty;

            result = englobbed(['homer.js'], '?i*');
            expect(result[0]).to.be.empty;
        });
    });
});

describe('When multiple literal parts matched', function () {
    describe('englobbed', function () {
        it('should return in an array {type: "literal", pattern: <literal_str>, match: <matched_str>} for each literal match', function () {
            let result = englobbed(['homer.js'], 'h*s');
            expect(result[0][0]).to.eql({type: 'literal', pattern: 'h', match: 'h'});
            expect(result[0][2]).to.eql({type: 'literal', pattern: 's', match: 's'});

            result = englobbed(['homer.js'], 'home**js');
            expect(result[0][0]).to.eql({type: 'literal', pattern: 'home', match: 'home'});
            expect(result[0][2]).to.eql({type: 'literal', pattern: 'js', match: 'js'});

            result = englobbed(['homer.js'], 'homer?js');
            expect(result[0][0]).to.eql({type: 'literal', pattern: 'homer', match: 'homer'});
            expect(result[0][2]).to.eql({type: 'literal', pattern: 'js', match: 'js'});

            result = englobbed(['homer.js'], 'ho?e??js');
            expect(result[0][0]).to.eql({type: 'literal', pattern: 'ho', match: 'ho'});
            expect(result[0][2]).to.eql({type: 'literal', pattern: 'e', match: 'e'});
            expect(result[0][5]).to.eql({type: 'literal', pattern: 'js', match: 'js'});

            result = englobbed(['homer.js'], '*ho?e*?s');
            expect(result[0][1]).to.eql({type: 'literal', pattern: 'ho', match: 'ho'});
            expect(result[0][3]).to.eql({type: 'literal', pattern: 'e', match: 'e'});
            expect(result[0][6]).to.eql({type: 'literal', pattern: 's', match: 's'});
        });
    });
});

describe('When literal parts contain "^" and "$" characters', function () {
    describe('englobbed', function () {
        it('should return in an array {type: "literal", pattern: <literal_str>, match: <matched_str>} for each literal match)', function () {
            let result = englobbed(['homer^.js'], 'homer^.js');
            expect(result[0][0]).to.eql({type: 'literal', pattern: 'homer^.js', match: 'homer^.js'});
            result = englobbed(['homer.$js'], 'homer.$js');
            expect(result[0][0]).to.eql({type: 'literal', pattern: 'homer.$js', match: 'homer.$js'});
            result = englobbed(['^homer.js'], '^homer.js');
            expect(result[0][0]).to.eql({type: 'literal', pattern: '^homer.js', match: '^homer.js'});
            result = englobbed(['homer.as$'], 'homer.as$');
            expect(result[0][0]).to.eql({type: 'literal', pattern: 'homer.as$', match: 'homer.as$'});
            result = englobbed(['^homer.as$'], '^homer.as$');
            expect(result[0][0]).to.eql({type: 'literal', pattern: '^homer.as$', match: '^homer.as$'});
            result = englobbed(['$homer.as^'], '$homer.as^');
            expect(result[0][0]).to.eql({type: 'literal', pattern: '$homer.as^', match: '$homer.as^'});
        });
    });

    describe('englobbed', function () {
        it('should return an empty array if not matching', function () {
            let result = englobbed(['homer.txt'], '^homer.txt$');
            expect(result[0]).to.be.empty;
            result = englobbed(['homer.txt'], '$homer.txt^');
            expect(result[0]).to.be.empty;
            result = englobbed(['^^homer.txt$$'], '^homer.txt$');
            expect(result[0]).to.be.empty;
        });
    });
});

/*
 * -------------------------------------------------------------------------------------------
 * ------------------------ Tests mixed wildcards and literals -------------------------------
 * -------------------------------------------------------------------------------------------
 */
describe('When a mix of wildcards and literal parts are used in glob pattern', function () {
    describe('englobbed', function () {
        it('should return an array of {type, pattern, match} for each part of the pattern, if all parts match', function () {
            let result = englobbed(['homer.js'], '*.?s');
            expect(result[0][0]).to.eql({type: 'wildcard', pattern: '*', match: 'homer'});
            expect(result[0][1]).to.eql({type: 'literal', pattern: '.', match: '.'});
            expect(result[0][2]).to.eql({type: 'wildcard', pattern: '?', match: 'j'});
            expect(result[0][3]).to.eql({type: 'literal', pattern: 's', match: 's'});

            result = englobbed(['homer.js'], '*?');
            expect(result[0][0]).to.eql({type: 'wildcard', pattern: '*', match: 'homer.j'});
            expect(result[0][1]).to.eql({type: 'wildcard', pattern: '?', match: 's'});

            result = englobbed(['homer.js'], '?**?');
            expect(result[0][0]).to.eql({type: 'wildcard', pattern: '?', match: 'h'});
            expect(result[0][1]).to.eql({type: 'wildcard', pattern: '*', match: 'omer.j'});
            expect(result[0][2]).to.eql({type: 'wildcard', pattern: '?', match: 's'});

            result = englobbed(['homer.js'], '???*??**???');
            expect(result[0][0]).to.eql({type: 'wildcard', pattern: '?', match: 'h'});
            expect(result[0][1]).to.eql({type: 'wildcard', pattern: '?', match: 'o'});
            expect(result[0][2]).to.eql({type: 'wildcard', pattern: '?', match: 'm'});
            expect(result[0][3]).to.eql({type: 'wildcard', pattern: '*', match: ''});
            expect(result[0][4]).to.eql({type: 'wildcard', pattern: '?', match: 'e'});
            expect(result[0][5]).to.eql({type: 'wildcard', pattern: '?', match: 'r'});
            expect(result[0][6]).to.eql({type: 'wildcard', pattern: '*', match: ''});
            expect(result[0][7]).to.eql({type: 'wildcard', pattern: '?', match: '.'});
            expect(result[0][8]).to.eql({type: 'wildcard', pattern: '?', match: 'j'});
            expect(result[0][9]).to.eql({type: 'wildcard', pattern: '?', match: 's'});

            result = englobbed(['homer.js'], '?o??r**.*');
            expect(result[0][0]).to.eql({type: 'wildcard', pattern: '?', match: 'h'});
            expect(result[0][1]).to.eql({type: 'literal', pattern: 'o', match: 'o'});
            expect(result[0][2]).to.eql({type: 'wildcard', pattern: '?', match: 'm'});
            expect(result[0][3]).to.eql({type: 'wildcard', pattern: '?', match: 'e'});
            expect(result[0][4]).to.eql({type: 'literal', pattern: 'r', match: 'r'});
            expect(result[0][5]).to.eql({type: 'wildcard', pattern: '*', match: ''});
            expect(result[0][6]).to.eql({type: 'literal', pattern: '.', match: '.'});
            expect(result[0][7]).to.eql({type: 'wildcard', pattern: '*', match: 'js'});

            // * is greedy
            result = englobbed(['homer.js'], '*??*');
            expect(result[0][0]).to.eql({type: 'wildcard', pattern: '*', match: 'homer.'});
            expect(result[0][1]).to.eql({type: 'wildcard', pattern: '?', match: 'j'});
            expect(result[0][2]).to.eql({type: 'wildcard', pattern: '?', match: 's'});
            expect(result[0][3]).to.eql({type: 'wildcard', pattern: '*', match: ''});
        });

        it('should return an empty array if any part, except for wildcard *, of the glob does not match', function () {
            let result = englobbed(['homer.js'], '*.js?');
            expect(result[0]).to.be.empty;

            result = englobbed(['homer.js'], '*.???');
            expect(result[0]).to.be.empty;

            result = englobbed(['homer.js'], '*..??');
            expect(result[0]).to.be.empty;
        });

        it('should return an empty array if glob does not completely match the path', function () {
            let result = englobbed(['homer.js'], '?js');
            expect(result[0]).to.be.empty;

            result = englobbed(['homer.js'], '?');
            expect(result[0]).to.be.empty;

            result = englobbed(['homer.js'], '*.?');
            expect(result[0]).to.be.empty;

            result = englobbed(['homer.js'], 'ho*?j');
            expect(result[0]).to.be.empty;

            result = englobbed(['homer.js'], 'homer');
            expect(result[0]).to.be.empty;
        })
    });
});


