'use strict';
const expect  = require('chai').expect;
const sinon   = require('sinon');

const renamer = require('../src/mv-renamer').create();

describe('When parameters of invalid type are passed', function () {
    describe('renamer.computeName(names, srcGlob, dstGlob)', function () {
        it('should throw a TypeError', function () {
            try {
                this.myRenamer.computeName({}, '*.txt', '*.out');
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid type for names! Must be a string or an Array of string.');
            }
            try {
                this.myRenamer.computeName(1, '*.txt', '*.out');
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid type for names! Must be a string or an Array of string.');
            }
            try {
                this.myRenamer.computeName(['bob-smith'], [], '???-*');
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid type for glob pattern! Must be a non-empty string.');
            }
            try {
                this.myRenamer.computeName('bob-smith', '*-???', 0);
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid type for glob pattern! Must be a non-empty string.');
            }
            try {
                this.myRenamer.computeName(['bob-smith'], '', {});
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid type for glob pattern! Must be a non-empty string.');
            }
            try {
                this.myRenamer.computeName(['bob-smith'], '???-*', '');
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid type for glob pattern! Must be a non-empty string.');
            }
            try {
                this.myRenamer.computeName('bob-smith', 1, '');
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid type for glob pattern! Must be a non-empty string.');
            }
            try {
                this.myRenamer.computeName([], '*', '*');
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid names list. Array must be non-empty.');
            }
            expect(this.myRenamer.computeName.alwaysThrew('TypeError')).to.be.true;
        });

        beforeEach(function () {
            this.myRenamer = renamer;
            sinon.spy(this.myRenamer, 'computeName');
        });

        afterEach(function () {
            this.myRenamer.computeName.restore();
        });
    });
});

/*
            Source glob doesn't match
 */
describe('When source glob does not match anything', function () {
    describe('renamer.computeName(names, srcGlob, dstGlob)', function () {
        it('should return empty string as result', function () {
            let result = renamer.computeName(['alx-rose.red', '_1234'], '*.????', '*');
            expect(result[0]).to.be.empty;
            expect(result[1]).to.be.empty;

            result = renamer.computeName('^$', '?', '?');
            expect(result[0]).to.be.empty;
            result = renamer.computeName('.', '**??', '*?');
            expect(result[0]).to.be.empty;
            result = renamer.computeName('123.456', '*_*', '*');
            expect(result[0]).to.be.empty;
            result = renamer.computeName('^abc$', '???b??*', '???');
            expect(result[0]).to.be.empty;
            result = renamer.computeName('1234', '123', '6789');
            expect(result[0]).to.be.empty;
            result = renamer.computeName('1234', '12345', '6789');
            expect(result[0]).to.be.empty;
            result = renamer.computeName('1234', '*2**5', '**6789');
            expect(result[0]).to.be.empty;
            result = renamer.computeName('1234', '12?45', '?6789');
            expect(result[0]).to.be.empty;
        });
    });
});

/*
            # of wildcards in SG < in DG
 */
describe('When number of given wildcard in destination glob is higher than in source glob', function () {
    describe('renamer.computeName(names, srcGlob, dstGlob)', function () {
        beforeEach(function () {
            this.myRenamer = renamer;
            sinon.spy(this.myRenamer, 'computeName');
        });

        afterEach(function () {
            this.myRenamer.computeName.restore();
        });

        it('should throw an Error', function () {
            /************ # of ? in SG < in DG ************/
            try {
                this.myRenamer.computeName('alx-rose.red', '*', '*?');
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid glob pattern. Destination glob contains more wildcards than source. (** is treated as * in source glob.)');
            }
            try {
                this.myRenamer.computeName('^$', '??', '???');
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid glob pattern. Destination glob contains more wildcards than source. (** is treated as * in source glob.)');
            }
            try {
                this.myRenamer.computeName('^bruce.wayne$', '*?*', '??');
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid glob pattern. Destination glob contains more wildcards than source. (** is treated as * in source glob.)');
            }
            try {
                this.myRenamer.computeName('^bruce.wayne$', '*.wayne?', '??');
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid glob pattern. Destination glob contains more wildcards than source. (** is treated as * in source glob.)');
            }
            try {
                this.myRenamer.computeName('uvwxyz', 'uvwxyz', '123456?');
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid glob pattern. Destination glob contains more wildcards than source. (** is treated as * in source glob.)');
            }

            /************ # of * in SG < in DG ************/
            try {
                this.myRenamer.computeName('.', '*', '*.*');
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid glob pattern. Destination glob contains more wildcards than source. (** is treated as * in source glob.)');
            }
            try {
                this.myRenamer.computeName('.', '?', '?*');
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid glob pattern. Destination glob contains more wildcards than source. (** is treated as * in source glob.)');
            }
            // ** is src glob counts as * ; but ** in dst glob remains unchanged
            try {
                this.myRenamer.computeName('abc', '**', '**');
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid glob pattern. Destination glob contains more wildcards than source. (** is treated as * in source glob.)');
            }
            // ***b* -> *b* in src glob; but *** in dst glob remains unchanged
            try {
                this.myRenamer.computeName('abc', '***b*', '***');
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid glob pattern. Destination glob contains more wildcards than source. (** is treated as * in source glob.)');
            }
            try {
                this.myRenamer.computeName('abc', '*ab**', '***');
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid glob pattern. Destination glob contains more wildcards than source. (** is treated as * in source glob.)');
            }
            try {
                this.myRenamer.computeName('uvwxyz', 'uvwxyz', '123456*');
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid glob pattern. Destination glob contains more wildcards than source. (** is treated as * in source glob.)');
            }

            expect(this.myRenamer.computeName.alwaysThrew('Error')).to.be.true;
        });
    });
});


/*
            # wildcard in SG >= in DG
 */
describe('When number of given wildcard in destination glob is equal or fewer than in source glob', function () {
    describe('renamer.computeName(names, srcGlob, dstGlob)', function () {
        it('should return computed new name', function () {
            /************ # of ? in SG >= in DG ************/
            let result = renamer.computeName('alx-rose.red', '*?', '?onald');
            expect(result[0]).to.be.eql('donald');
            result = renamer.computeName('.', '*?*', '?');
            expect(result[0]).to.be.eql('.');
            result = renamer.computeName('abcdef', '*??*', '?');
            expect(result[0]).to.be.eql('e');
            result = renamer.computeName('^$', '?*?', '??');
            expect(result[0]).to.be.eql('^$');
            result = renamer.computeName('^abc$', '?abc?', '?123?');
            expect(result[0]).to.be.eql('^123$');
            result = renamer.computeName('^abc$', '**??b??*', '???');
            expect(result[0]).to.be.eql('^ac');
            result = renamer.computeName('^abc$', '*??b??*', '?*?*?');
            expect(result[0]).to.be.eql('^ac');
            result = renamer.computeName('.', '?**', '?');
            expect(result[0]).to.be.eql('.');

            /************ # of * in SG >= in DG ************/
            result = renamer.computeName('.', '*?', '?*');
            expect(result[0]).to.be.eql('.');
            result = renamer.computeName(['.'], '*?', '*');
            expect(result[0]).to.be.eql('');
            result = renamer.computeName('123456', '*?*', '**?');
            expect(result[0]).to.be.eql('123456');
            result = renamer.computeName('abc', '*a*b*c*', '***');
            expect(result[0]).to.be.eql('');
            result = renamer.computeName(['abcdef', '123bf4'], '**b**f**', '***');
            expect(result[0]).to.be.eql('acde');
            expect(result[1]).to.be.eql('1234');


            /*********** cases with wildcards in path **********/
            result = renamer.computeName('test/test-data/123.doc', '*t/?es?-**/*.???*', 'test/*?-*2/????.**');
            expect(result[0]).to.be.eql('test/test-data2/tdoc.123');
        });
    });
});

/*
            When source glob is a literal
 */
describe('When source glob is a literal', function () {
    describe('renamer.computeName(names, srcGlob, dstGlob)', function () {
        it('should return literally the dst glob, only if it does not contain any wildcard', function () {
            let result = renamer.computeName('uvwxyz', 'uvwxyz', '123456');
            expect(result[0]).to.be.eql('123456');

            // but should return empty string if src glob does not match
            result = renamer.computeName('uvwxyz', 'uvwxy', '12345');
            expect(result[0]).to.be.empty;
        });
    });
});

/*
            When destination glob is a literal
 */
describe('When destination glob is a literal', function () {
    describe('renamer.computeName(names, srcGlob, dstGlob)', function () {
        it('should return a literally the dst glob, the source glob matches', function () {
            let result = renamer.computeName('uvwxyz', '*', '123456');
            expect(result[0]).to.be.eql('123456');
            result = renamer.computeName('uvwxyz', 'abc', '123456');
            expect(result[0]).to.be.empty;
            result = renamer.computeName('uvwxyz', '???', '123456');
            expect(result[0]).to.be.empty;
            result = renamer.computeName('uvwxyz', '*u', '123456');
            expect(result[0]).to.be.empty;
            result = renamer.computeName('uvwxyz', '*z', '123456');
            expect(result[0]).to.be.eql('123456');
        });
    });
});

/*
            When names is an array of string
 */
describe('When names is an array of string', function () {
    describe('renamer.computeName(names, srcGlob, dstGlob)', function () {
        it('should return an array of new names', function () {
            let result = renamer.computeName(['abcde', '1234', '!@#$%^&'], '*', 'uvwxyz');
            expect(result.length).to.eql(3);
            expect(result[0]).to.eql('uvwxyz');
            expect(result[1]).to.eql('uvwxyz');
            expect(result[2]).to.eql('uvwxyz');
            result = renamer.computeName(['abcde', '1234', '!@#$%^&'], '*', '*');
            expect(result.length).to.eql(3);
            expect(result[0]).to.eql('abcde');
            expect(result[1]).to.eql('1234');
            expect(result[2]).to.eql('!@#$%^&');
            result = renamer.computeName(['abcde', '1234', '!@#$%^&'], '???', '123???');
            expect(result.length).to.eql(3);
            expect(result[0]).to.be.empty;
            expect(result[1]).to.be.empty;
            expect(result[2]).to.be.empty;
            result = renamer.computeName(['abcde', '1234', '!@#$%^&'], '*????', '*');
            expect(result.length).to.eql(3);
            expect(result[0]).to.eql('a');
            expect(result[1]).to.eql('');
            expect(result[2]).to.eql('!@#');
            result = renamer.computeName(['abcde', '1234', '!@#$%^&'], '???????', '???????');
            expect(result.length).to.eql(3);
            expect(result[0]).to.be.empty;
            expect(result[1]).to.be.empty;
            expect(result[2]).to.eql('!@#$%^&');
            result = renamer.computeName(['abcde', '1234', '!@#$%^&'], '!@#$%^&', 'xyz');
            expect(result.length).to.eql(3);
            expect(result[0]).to.be.empty;
            expect(result[1]).to.be.empty;
            expect(result[2]).to.eql('xyz');
            result = renamer.computeName(['123', '5637', '893', 'abc'], '??3', '?-?');
            expect(result.length).to.eql(4);
            expect(result[0]).to.eql('1-2');
            expect(result[1]).to.be.empty;
            expect(result[2]).to.eql('8-9');
            expect(result[3]).to.be.empty;
            result = renamer.computeName(['123', '5637', '3', 'a3cd'], '??3*', '?-?-*');
            expect(result.length).to.eql(4);
            expect(result[0]).to.eql('1-2-');
            expect(result[1]).to.eql('5-6-7');
            expect(result[2]).to.be.empty;
            expect(result[3]).to.be.empty;
        });
    });
});

/*
            When "names" is a string
 */
describe('When string is passed in "names" argument', function () {
    describe('renamer.computeName(names, srcGlob, dstGlob)', function () {
        it('should return a result array with a single element', function () {
            let result = renamer.computeName('axl-rose', '*', '*');
            expect(result.length).to.eql(1);
            expect(result[0]).to.eql('axl-rose');

            result = renamer.computeName('', '?', '?');
            expect(result.length).to.eql(1);
            expect(result[0]).to.be.empty;
        });
    });
});
