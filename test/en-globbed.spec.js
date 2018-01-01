'use strict';

const expect    = require('chai').expect;
// const sinon     = require('sinon');

const capture = require('../src/en-globbed').capture;

/*
 * ----------------------------------------------------------------------------------------------------
 * ------------------------------- Argument Handling Test Cases for capture() -------------------------
 * ----------------------------------------------------------------------------------------------------
 */
describe('When receiving multiple names', function () {
    describe('capture()', function () {
        it('should return a number of results matching number of names received', function () {
            let result = capture(['marge.json', 'barney.txt'], '*.t?t');
            expect(result.length).to.equal(2);

            result = capture(['marge.json', 'barney.txt', 'maggie.doc'], '?.js');
            expect(result.length).to.equal(3);

            result = capture(['bart.bar', 'lisa', 'maggie.', 'mr.burns'], '*');
            expect(result.length).to.equal(4);
        });
    });
});

describe('When array of names is empty', function () {
    describe('capture()', function () {
        it('should return null', function () {
            let result = capture([], '*.ex?');
            expect(result).to.be.null;
        });
    });
});

describe('When first argument is not an array', function () {
    describe('capture()', function () {
        it('should return null', function () {
            let result = capture('bob', '*.js');
            expect(result).to.be.null;
            result = capture('', '*');
            expect(result).to.be.null;

            result = capture(10, '*.txt');
            expect(result).to.be.null;

            result = capture({}, '*.js');
            expect(result).to.be.null;

            result = capture();
            expect(result).to.be.null;
        });
    });
});

describe('When receiving anything other than non-empty string as 2nd argument', function () {
    describe('capture()', function () {
        it('should return null', function () {
            let result = capture([], 2);
            expect(result).to.be.null;

            result = capture([], '');
            expect(result).to.be.null;

            result = capture([], []);
            expect(result).to.be.null;

            result = capture([], {});
            expect(result).to.be.null;

            result = capture([]);
            expect(result).to.be.null;
        });
    });
});
/*
 * ----------------------------------------------------------------------------------
 * ------------------------- Test cases for * wildcard ------------------------------
 * ----------------------------------------------------------------------------------
 */
describe('When * wildcard matches multiple characters', function () {
    describe('capture()[x].getGroups()', function () {
        it('should return an array of {type: "wildcard", pattern: "*", match: <matched_str>}', function () {
            let result = capture(['homer.js'], '*.js');
            expect(result[0].getGroups()[0]).to.eql({type: 'wildcard', pattern: '*', match: 'homer'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.js'], 'homer*');
            expect(result[0].getGroups()[1]).to.eql({type: 'wildcard', pattern: '*', match: '.js'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.js'], 'h*s');
            expect(result[0].getGroups()[1]).to.eql({type: 'wildcard', pattern: '*', match: 'omer.j'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['lisa', 'maggie.', 'x'], '*');
            expect(result[0].getGroups()[0]).to.eql({type: 'wildcard', pattern: '*', match: 'lisa'});
            expect(result[1].getGroups()[0]).to.eql({type: 'wildcard', pattern: '*', match: 'maggie.'});
            expect(result[2].getGroups()[0]).to.eql({type: 'wildcard', pattern: '*', match: 'x'});
            expect(result[0].hasMatch()).to.be.true;
            expect(result[1].hasMatch()).to.be.true;
            expect(result[2].hasMatch()).to.be.true;
        });
    });
});

describe('When * wildcard matches a single character', function () {
   describe('capture()[x].getGroups()', function () {
       it('should return an array of {type: "wildcard", pattern: "*", match: <matched_char>}', function () {
           let result = capture(['homer.js'], '*omer.js');
           expect(result[0].getGroups()[0]).to.eql({type: 'wildcard', pattern: '*', match: 'h'});
           expect(result[0].hasMatch()).to.be.true;

           result = capture(['homer.js'], 'homer*js');
           expect(result[0].getGroups()[1]).to.eql({type: 'wildcard', pattern: '*', match: '.'});
           expect(result[0].hasMatch()).to.be.true;

           result = capture(['homer.js'], 'homer.j*');
           expect(result[0].getGroups()[1]).to.eql({type: 'wildcard', pattern: '*', match: 's'});
           expect(result[0].hasMatch()).to.be.true;
       });
   });
});

describe('When * wildcard matches no character', function () {
    describe('capture()[x].getGroups()', function () {
        it('should return an array of {type: "wildcard", pattern: "*", match: ""} because * matches zero or more characters', function () {
            let result = capture(['homer.js'], '*homer.js');
            expect(result[0].getGroups()[0]).to.eql({type: 'wildcard', pattern: '*', match: ''});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.js'], 'homer*.js');
            expect(result[0].getGroups()[1]).to.eql({type: 'wildcard', pattern: '*', match: ''});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.js'], 'homer.js*');
            expect(result[0].getGroups()[1]).to.eql({type: 'wildcard', pattern: '*', match: ''});
            expect(result[0].hasMatch()).to.be.true;
        });
    });
});

describe('When ** is specified', function () {
    describe('capture()', function () {
        it('should treat ** like *, e.g. {type: "wildcard", pattern: "*", match: <matched_str>}', function () {
            let result = capture(['homer.js'], '**.js');
            expect(result[0].getGroups().length).to.equal(2);
            expect(result[0].getGroups()[0]).to.eql({type: 'wildcard', pattern: '*', match: 'homer'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.js'], 'homer**js');
            expect(result[0].getGroups().length).to.equal(3);
            expect(result[0].getGroups()[1]).to.eql({type: 'wildcard', pattern: '*', match: '.'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.js'], 'homer?js**');
            expect(result[0].getGroups().length).to.equal(4);
            expect(result[0].getGroups()[3]).to.eql({type: 'wildcard', pattern: '*', match: ''});
            expect(result[0].hasMatch()).to.be.true;
        });
    });
});

describe('When * wildcard is used in glob pattern', function () {
    describe('capture()[x].getAsterisk()', function () {
        it('should return { type, pattern, match } with pattern="*" for every instances of *', function () {
            let result = capture(['homersimpsons.txt'], '*hom??*m**.?*?');
            expect(result[0].getAsterisk()[0]).to.eql({ type: 'wildcard', pattern: '*', match: '' });
            expect(result[0].getAsterisk()[1]).to.eql({ type: 'wildcard', pattern: '*', match: 'si' });
            expect(result[0].getAsterisk()[2]).to.eql({ type: 'wildcard', pattern: '*', match: 'psons' });
            expect(result[0].getAsterisk()[3]).to.eql({ type: 'wildcard', pattern: '*', match: 'x' });
            expect(result[0].hasMatch()).to.be.true;

            result = capture([''], '*');
            expect(result[0].getAsterisk().length).to.eql(1);
            expect(result[0].getAsterisk()[0]).to.eql({ type: 'wildcard', pattern: '*', match: '' });
            expect(result[0].hasMatch()).to.be.true;
        });

        it('should return empty array if no match', function () {
            let result = capture(['Bomersimpsons.txt'], '*hom??*m*.?**?');
            expect(result[0].getAsterisk()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;
        });

        it('should return empty array if no * wildcard used', function () {
            let result = capture(['homer.txt'], 'homer.???');
            expect(result[0].getAsterisk()).to.be.empty;
            expect(result[0].hasMatch()).to.be.true;
        });

        it('should return empty array when invalid parameter used for capture()', function () {
            let result = capture([11], '*');
            expect(result.length).to.eql(1);
            expect(result[0].getAsterisk()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture([{}, 'bob'], '**');
            expect(result.length).to.eql(2);
            expect(result[0].getAsterisk()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;
        });
        //TODO: TO BE CONTINUED...?
    });
});


/*
 * ------------------------------------------------------------------------------
 * ------------------- Tests cases for ? wildcard -------------------------------
 * ------------------------------------------------------------------------------
 */
describe('When ? wildcard matches one character', function () {
    describe('capture()[x].getGroups', function () {
        it('should return an array of {type: "wildcard", pattern: "?", match: <matched_char>}', function () {
            let result = capture(['homer.js'], '?omer.js');
            expect(result[0].getGroups()[0]).to.eql({type: 'wildcard', pattern: '?', match: 'h'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.js'], 'homer?js');
            expect(result[0].getGroups()[1]).to.eql({type: 'wildcard', pattern: '?', match: '.'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.js'], 'homer.j?');
            expect(result[0].getGroups()[1]).to.eql({type: 'wildcard', pattern: '?', match: 's'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['.', 'x'], '?');
            expect(result[0].getGroups()[0]).to.eql({type: 'wildcard', pattern: '?', match: '.'});
            expect(result[1].getGroups()[0]).to.eql({type: 'wildcard', pattern: '?', match: 'x'});
            expect(result[0].hasMatch()).to.be.true;
            expect(result[1].hasMatch()).to.be.true;
        });
    });
});

describe('When ? wildcard matches no character', function () {
    describe('capture()[x].getGroups()', function () {
        it('should return empty array (i.e. no match)', function () {
            let result = capture(['homer.js'], '?homer.js');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer.js'], 'homer.js?');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer.js'], 'homer?.js');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['bart'], '?????');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;
        });
    });
});

describe('When ? wildcards do not match enough characters', function () {
    describe('capture()[x].getGroups()', function () {
        it('should return empty array (i.e. no match)', function () {
            let result = capture(['barney.beer'], '?');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer'], '???');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;
        });
    });
});

describe('When multiple ? wildcards are used', function () {
    describe('capture()[x].getGroups()', function () {
        it('should return empty array (i.e. no match), if one or more ? have no match', function () {
            let result = capture(['homer.js'], '??omer.js');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer.js'], 'homer.j??');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer.js'], 'home??.js');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer.js'], '??????????');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer.js'], '?homer.js');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer.js'], 'homer.js?');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;
        });

        it('should return in an array of {type: "wildcard", pattern: "?", match: <matched_char>} for each ?, if all of them have a match', function () {
            let result = capture(['homer.js'], 'ho?er?js');
            expect(result[0].getGroups()[1]).to.eql({type: 'wildcard', pattern: '?', match: 'm'});
            expect(result[0].getGroups()[3]).to.eql({type: 'wildcard', pattern: '?', match: '.'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.js'], '????????');
            expect(result[0].getGroups()[0]).to.eql({type: 'wildcard', pattern: '?', match: 'h'});
            expect(result[0].getGroups()[1]).to.eql({type: 'wildcard', pattern: '?', match: 'o'});
            expect(result[0].getGroups()[2]).to.eql({type: 'wildcard', pattern: '?', match: 'm'});
            expect(result[0].getGroups()[3]).to.eql({type: 'wildcard', pattern: '?', match: 'e'});
            expect(result[0].getGroups()[4]).to.eql({type: 'wildcard', pattern: '?', match: 'r'});
            expect(result[0].getGroups()[5]).to.eql({type: 'wildcard', pattern: '?', match: '.'});
            expect(result[0].getGroups()[6]).to.eql({type: 'wildcard', pattern: '?', match: 'j'});
            expect(result[0].getGroups()[7]).to.eql({type: 'wildcard', pattern: '?', match: 's'});
            expect(result[0].hasMatch()).to.be.true;
        });
    });
});

describe('When ? wildcard is used in glob pattern', function () {
    describe('capture()[x].getQuestionMark()', function () {
        it('should return { type, pattern, match } with pattern="?" for every instances of ?', function () {
            let result = capture(['homersimpsons.tx$'], '*hom??*m**.?*?');
            expect(result[0].getQuestionMark()[0]).to.eql({ type: 'wildcard', pattern: '?', match: 'e' });
            expect(result[0].getQuestionMark()[1]).to.eql({ type: 'wildcard', pattern: '?', match: 'r' });
            expect(result[0].getQuestionMark()[2]).to.eql({ type: 'wildcard', pattern: '?', match: 't' });
            expect(result[0].getQuestionMark()[3]).to.eql({ type: 'wildcard', pattern: '?', match: '$' });
            expect(result[0].hasMatch()).to.be.true;
        });

        it('should return empty array if no match', function () {
            let result = capture(['Bomersimpsons.txt'], '*hom??*m*.?**?');
            expect(result[0].getQuestionMark()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture([''], '?');
            expect(result[0].getQuestionMark()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['^omer$'], '???????');
            expect(result[0].getQuestionMark()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;
        });

        it('should return empty array if no ? wildcard used', function () {
            let result = capture(['homer.txt'], 'homer.*');
            expect(result[0].getQuestionMark()).to.be.empty;
            expect(result[0].hasMatch()).to.be.true;
        });

        it('should return empty array when invalid parameter used for capture()', function () {
            let result = capture([11], '?');
            expect(result.length).to.eql(1);
            expect(result[0].getQuestionMark()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture([{}, 'bob'], '???');
            expect(result.length).to.eql(2);
            expect(result[0].getQuestionMark()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;
        });
        //TODO: TO BE CONTINUED...?
    });
});

/*
 * --------------------------------------------------------------------------------------
 * ------------------------------- Test cases for literals ------------------------------
 * --------------------------------------------------------------------------------------
 */
describe('When the literal part is matched', function () {
    describe('capture()[x].getGroups()', function () {
        it('should return in an array of {type: "literal", pattern: <literal_str>, match: <matched_str>}', function () {
            let result = capture(['homer.js'], 'homer.js');
            expect(result[0].getGroups()[0]).to.eql({type: 'literal', pattern: 'homer.js', match: 'homer.js'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer..js'], 'homer..js');
            expect(result[0].getGroups()[0]).to.eql({type: 'literal', pattern: 'homer..js', match: 'homer..js'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.js'], '*.js');
            expect(result[0].getGroups()[1]).to.eql({type: 'literal', pattern: '.js', match: '.js'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.js'], 'h**');
            expect(result[0].getGroups()[0]).to.eql({type: 'literal', pattern: 'h', match: 'h'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.js'], '*o*');
            expect(result[0].getGroups()[1]).to.eql({type: 'literal', pattern: 'o', match: 'o'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.js'], '?omer.??');
            expect(result[0].getGroups()[1]).to.eql({type: 'literal', pattern: 'omer.', match: 'omer.'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['a', 'a'], 'a');
            expect(result[0].getGroups()[0]).to.eql({type: 'literal', pattern: 'a', match: 'a'});
            expect(result[1].getGroups()[0]).to.eql({type: 'literal', pattern: 'a', match: 'a'});
            expect(result[0].hasMatch()).to.be.true;
            expect(result[1].hasMatch()).to.be.true;

            result = capture(['pop(tarts)TXT', ')Tpop(tarts'], 'pop(tarts)TXT');
            expect(result.length).to.eql(2);
            expect(result[0].hasMatch()).to.be.true;
            expect(result[0].getGroups()[0]).to.eql({type: 'literal', pattern: 'pop(tarts)TXT', match: 'pop(tarts)TXT'});
            expect(result[0].getGroups().length).to.eql(1);

            result = capture([')whe(re(is)my)sweet()(pop((tarts))TXT'], ')whe(re(is)my)sweet()(pop((tarts))TXT');
            expect(result.length).to.eql(1);
            expect(result[0].hasMatch()).to.be.true;
            expect(result[0].getGroups()[0]).to.eql({type: 'literal', pattern: ')whe(re(is)my)sweet()(pop((tarts))TXT', match: ')whe(re(is)my)sweet()(pop((tarts))TXT'});
            expect(result[0].getGroups().length).to.eql(1);
        });
    });
});

describe('When the literal part has no match', function () {
    describe('capture()[x].getGroups()', function () {
        it('should return an empty array', function () {
            let result = capture(['homer.js'], 'homar.js');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer.js'], '*.j');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer.js'], 'o*');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer.js'], '*a*');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer.js'], '*.');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer.js'], '?omar.??');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer.js'], '?i*');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer.js'], 'homer');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['pop(tarts)TXT', ')Tpop(tarts'], 'pop(tarts)TXT');
            expect(result.length).to.eql(2);
            expect(result[1].getGroups()).to.be.empty;
            expect(result[1].hasMatch()).to.be.false;
        });
    });
});

describe('When multiple literal parts matched', function () {
    describe('capture()[x].getGroups()', function () {
        it('should return in an array of {type: "literal", pattern: <literal_str>, match: <matched_str>} for each literal match', function () {
            let result = capture(['homer.js'], 'h*s');
            expect(result[0].getGroups()[0]).to.eql({type: 'literal', pattern: 'h', match: 'h'});
            expect(result[0].getGroups()[2]).to.eql({type: 'literal', pattern: 's', match: 's'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.js'], 'home**js');
            expect(result[0].getGroups()[0]).to.eql({type: 'literal', pattern: 'home', match: 'home'});
            expect(result[0].getGroups()[2]).to.eql({type: 'literal', pattern: 'js', match: 'js'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.js'], 'homer?js');
            expect(result[0].getGroups()[0]).to.eql({type: 'literal', pattern: 'homer', match: 'homer'});
            expect(result[0].getGroups()[2]).to.eql({type: 'literal', pattern: 'js', match: 'js'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.js'], 'ho?e??js');
            expect(result[0].getGroups()[0]).to.eql({type: 'literal', pattern: 'ho', match: 'ho'});
            expect(result[0].getGroups()[2]).to.eql({type: 'literal', pattern: 'e', match: 'e'});
            expect(result[0].getGroups()[5]).to.eql({type: 'literal', pattern: 'js', match: 'js'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.js'], '*ho?e*?s');
            expect(result[0].getGroups()[1]).to.eql({type: 'literal', pattern: 'ho', match: 'ho'});
            expect(result[0].getGroups()[3]).to.eql({type: 'literal', pattern: 'e', match: 'e'});
            expect(result[0].getGroups()[6]).to.eql({type: 'literal', pattern: 's', match: 's'});
            expect(result[0].hasMatch()).to.be.true;
        });
    });
});

describe('When literal parts contain "^" and "$" characters', function () {
    describe('capture()[x].getGroups()', function () {
        it('should return in an array of {type: "literal", pattern: <literal_str>, match: <matched_str>} for each literal match)', function () {
            let result = capture(['homer^.js'], 'homer^.js');
            expect(result[0].getGroups()[0]).to.eql({type: 'literal', pattern: 'homer^.js', match: 'homer^.js'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.$js'], 'homer.$js');
            expect(result[0].getGroups()[0]).to.eql({type: 'literal', pattern: 'homer.$js', match: 'homer.$js'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['^homer.js'], '^homer.js');
            expect(result[0].getGroups()[0]).to.eql({type: 'literal', pattern: '^homer.js', match: '^homer.js'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.as$'], 'homer.as$');
            expect(result[0].getGroups()[0]).to.eql({type: 'literal', pattern: 'homer.as$', match: 'homer.as$'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['^homer.as$'], '^homer.as$');
            expect(result[0].getGroups()[0]).to.eql({type: 'literal', pattern: '^homer.as$', match: '^homer.as$'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['$homer.as^'], '$homer.as^');
            expect(result[0].getGroups()[0]).to.eql({type: 'literal', pattern: '$homer.as^', match: '$homer.as^'});
            expect(result[0].hasMatch()).to.be.true;
        });
    });

    describe('capture()[x].getGroups()', function () {
        it('should return an empty array if not matching', function () {
            let result = capture(['homer.txt'], '^homer.txt$');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer.txt'], '$homer.txt^');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['^^homer.txt$$'], '^homer.txt$');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;
        });
    });
});

/*
 * -------------------------------------------------------------------------------------------
 * ------------------------ Tests mixed wildcards and literals -------------------------------
 * -------------------------------------------------------------------------------------------
 */
describe('When a mix of wildcards and literal parts are used in glob pattern', function () {
    describe('capture()[x].getGroups()', function () {
        it('should return an array of {type, pattern, match} for each part of the pattern, if all parts match', function () {
            let result = capture(['homer.js'], '*.?s');
            expect(result[0].getGroups()[0]).to.eql({type: 'wildcard', pattern: '*', match: 'homer'});
            expect(result[0].getGroups()[1]).to.eql({type: 'literal', pattern: '.', match: '.'});
            expect(result[0].getGroups()[2]).to.eql({type: 'wildcard', pattern: '?', match: 'j'});
            expect(result[0].getGroups()[3]).to.eql({type: 'literal', pattern: 's', match: 's'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.js'], 'h*?');
            expect(result[0].getGroups()[0]).to.eql({type: 'literal', pattern: 'h', match: 'h'});
            expect(result[0].getGroups()[1]).to.eql({type: 'wildcard', pattern: '*', match: 'omer.j'});
            expect(result[0].getGroups()[2]).to.eql({type: 'wildcard', pattern: '?', match: 's'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.js'], '?**?');
            expect(result[0].getGroups()[0]).to.eql({type: 'wildcard', pattern: '?', match: 'h'});
            expect(result[0].getGroups()[1]).to.eql({type: 'wildcard', pattern: '*', match: 'omer.j'});
            expect(result[0].getGroups()[2]).to.eql({type: 'wildcard', pattern: '?', match: 's'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.js'], '???*??**???');
            expect(result[0].getGroups()[0]).to.eql({type: 'wildcard', pattern: '?', match: 'h'});
            expect(result[0].getGroups()[1]).to.eql({type: 'wildcard', pattern: '?', match: 'o'});
            expect(result[0].getGroups()[2]).to.eql({type: 'wildcard', pattern: '?', match: 'm'});
            expect(result[0].getGroups()[3]).to.eql({type: 'wildcard', pattern: '*', match: ''});
            expect(result[0].getGroups()[4]).to.eql({type: 'wildcard', pattern: '?', match: 'e'});
            expect(result[0].getGroups()[5]).to.eql({type: 'wildcard', pattern: '?', match: 'r'});
            expect(result[0].getGroups()[6]).to.eql({type: 'wildcard', pattern: '*', match: ''});
            expect(result[0].getGroups()[7]).to.eql({type: 'wildcard', pattern: '?', match: '.'});
            expect(result[0].getGroups()[8]).to.eql({type: 'wildcard', pattern: '?', match: 'j'});
            expect(result[0].getGroups()[9]).to.eql({type: 'wildcard', pattern: '?', match: 's'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['homer.js'], '?o??r**.*');
            expect(result[0].getGroups()[0]).to.eql({type: 'wildcard', pattern: '?', match: 'h'});
            expect(result[0].getGroups()[1]).to.eql({type: 'literal', pattern: 'o', match: 'o'});
            expect(result[0].getGroups()[2]).to.eql({type: 'wildcard', pattern: '?', match: 'm'});
            expect(result[0].getGroups()[3]).to.eql({type: 'wildcard', pattern: '?', match: 'e'});
            expect(result[0].getGroups()[4]).to.eql({type: 'literal', pattern: 'r', match: 'r'});
            expect(result[0].getGroups()[5]).to.eql({type: 'wildcard', pattern: '*', match: ''});
            expect(result[0].getGroups()[6]).to.eql({type: 'literal', pattern: '.', match: '.'});
            expect(result[0].getGroups()[7]).to.eql({type: 'wildcard', pattern: '*', match: 'js'});
            expect(result[0].hasMatch()).to.be.true;

            result = capture(['bart.bar', 'lisa', 'maggie.', 'mr.burns'], '*.');
            expect(result[2].getGroups()[0]).to.eql({type: 'wildcard', pattern: '*', match: 'maggie'});
            expect(result[2].getGroups()[1]).to.eql({type: 'literal', pattern: '.', match: '.'});
            expect(result[2].hasMatch()).to.be.true;
            expect(result[0].hasMatch()).to.be.false;
            expect(result[1].hasMatch()).to.be.false;
            expect(result[3].hasMatch()).to.be.false;

            // * is greedy
            result = capture(['homer.js'], '*??*');
            expect(result[0].getGroups()[0]).to.eql({type: 'wildcard', pattern: '*', match: 'homer.'});
            expect(result[0].getGroups()[1]).to.eql({type: 'wildcard', pattern: '?', match: 'j'});
            expect(result[0].getGroups()[2]).to.eql({type: 'wildcard', pattern: '?', match: 's'});
            expect(result[0].getGroups()[3]).to.eql({type: 'wildcard', pattern: '*', match: ''});
            expect(result[0].hasMatch()).to.be.true;
        });

        it('should return an empty array if any part, except for wildcard *, of the glob does not match', function () {
            let result = capture(['homer.js'], '*.js?');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer.js'], '*.???');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer.js'], '*..??');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;
        });

        it('should return an empty array if glob does not completely match the name', function () {
            let result = capture(['homer.js'], '?js');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer.js'], '?');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer.js'], '*.?');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer.js'], 'ho*?j');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['bart.bar', 'lisa', 'maggie.', 'mr.burns'], '*.');
            expect(result[0].getGroups()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;
            expect(result[1].getGroups()).to.be.empty;
            expect(result[1].hasMatch()).to.be.false;
            expect(result[3].getGroups()).to.be.empty;
            expect(result[3].hasMatch()).to.be.false;
            expect(result[2].hasMatch()).to.be.true;
        });
    });
});

/*
 * Testing Error Cases for capture().getGroups()
 */
describe('When invalid parameters are given to capture()', function () {
    describe('capture()[x].getGroups()', function () {
        it('should return an array containing an Error object', function () {
            let result = capture([0], '*.txt');
            expect(result.length).to.eql(1);
            expect(result[0].getGroups()[0]).to.be.instanceof(Error)
            .and.have.property('message', 'Invalid type! Expects a string.');
            expect(result[0].hasMatch()).to.be.false;

            result = capture([undefined], 'bob');
            expect(result[0].getGroups().length).to.eql(1);
            expect(result[0].getGroups()[0]).to.be.instanceof(Error)
            .and.have.property('message', 'Invalid type! Expects a string.');
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer', {}], '?');
            expect(result.length).to.eql(2);
            expect(result[0].getGroups()[0]).to.not.be.instanceof(Error);
            expect(result[1].getGroups()[0]).to.be.instanceof(Error)
            .and.have.property('message', 'Invalid type! Expects a string.');
            expect(result[0].hasMatch()).to.be.false;
            expect(result[1].hasMatch()).to.be.false;
        });
    });
});

/*
 * Testing Error Cases for capture().getAsterisk()
 */
describe('When invalid parameters are given to capture()', function () {
    describe('capture()[x].getAsterisk()', function () {
        it('should return an empty array', function () {
            let result = capture([0], '*.txt');
            expect(result.length).to.eql(1);
            expect(result[0].getAsterisk()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture([undefined], 'bob');
            expect(result[0].getAsterisk()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer', {}], '*');
            expect(result.length).to.eql(2);
            expect(result[0].getAsterisk()).to.not.be.empty;
            expect(result[1].getAsterisk()).to.be.empty;
            expect(result[0].hasMatch()).to.be.true;
            expect(result[1].hasMatch()).to.be.false;
        });
    });
});

/*
 * Testing Error Cases for capture().getQuestionMark()
 */
describe('When invalid parameters are given to capture()', function () {
    describe('capture()[x].getQuestionMark()', function () {
        it('should return an empty array', function () {
            let result = capture([0], '?.txt');
            expect(result.length).to.eql(1);
            expect(result[0].getQuestionMark()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture([undefined], 'bob');
            expect(result[0].getQuestionMark()).to.be.empty;
            expect(result[0].hasMatch()).to.be.false;

            result = capture(['homer', {}], '?????');
            expect(result.length).to.eql(2);
            expect(result[0].getQuestionMark()).to.not.be.empty;
            expect(result[1].getQuestionMark()).to.be.empty;
            expect(result[0].hasMatch()).to.be.true;
            expect(result[1].hasMatch()).to.be.false;
        });
    });
});
