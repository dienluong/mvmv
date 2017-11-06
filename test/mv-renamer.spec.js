'use strict';
const expect  = require('chai').expect;
const sinon   = require('sinon');

const renamer = require('../src/mv-renamer');

describe('When parameters of invalid type are passed', function () {
    describe('renamer.rename(names, srcGlob, dstGlob)', function () {
        beforeEach(function () {
            this.rename = renamer.rename;
            sinon.spy(this, 'rename');
        });

        afterEach(function () {
            this.rename.restore();
        });

        it('should throw a TypeError', function () {
            let result = null;
            try {
                result = this.rename({}, '*.txt', '*.out');
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid type for names!  Must be a string or an Array of string');
            }
            try {
                result = this.rename(1, '*.txt', '*.out');
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid type for names!  Must be a string or an Array of string');
            }
            try {
                result = this.rename(['bob-smith'], [], '???-*');
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid type for glob pattern! Must be a non-empty string.');
            }
            try {
                result = this.rename(['bob-smith'], '*-???', 0);
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid type for glob pattern! Must be a non-empty string.');
            }
            try {
                result = this.rename(['bob-smith'], '', {});
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid type for glob pattern! Must be a non-empty string.');
            }
            try {
                result = this.rename(['bob-smith'], '???-*', '');
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid type for glob pattern! Must be a non-empty string.');
            }
            try {
                result = this.rename('bob-smith', 1, '');
            }
            catch (e) {
                expect(e).to.be.instanceof(Error)
                .and.have.property('message', 'Invalid type for glob pattern! Must be a non-empty string.');
            }

            expect(this.rename.alwaysThrew('TypeError')).to.be.true;
        });
    });
});

/*
            Source glob doesn't match
 */
describe('When source glob does not match anything', function () {
    describe('renamer.rename(names, srcGlob, dstGlob)', function () {
        it.only('should return empty string as result', function () {
            let result = renamer.rename(['alx-rose.red', '_1234'], '*.????', '*');
            expect(result[0]).to.be.empty;
            expect(result[1]).to.be.empty;

            result = renamer.rename('^$', '?', '?');
            expect(result[0]).to.be.empty;

            result = renamer.rename('.', '*??', '*?');
            expect(result[0]).to.be.empty;

            result = renamer.rename('123.456', '*_*', '*');
            expect(result[0]).to.be.empty;

            result = renamer.rename('1234', '123', '6789');
            expect(result[0]).to.be.empty;
        });
    });
});

/*
            # wildcard in DG > in SG
 */
describe('When number of given wildcard in destination glob is higher than in source glob', function () {
    describe('renamer.rename(names, srcGlob, dstGlob)', function () {
        it('should return empty string as result', function () {
            let result = renamer.rename('alx-rose.red', '*', '?');
            expect(result[0]).to.be.empty;

            result = renamer.rename('^$', '?', '??');
            expect(result[0]).to.be.empty;

            result = renamer.rename('.', '?', '??');
            expect(result[0]).to.be.empty;

            result = renamer.rename('^bruce.wayne$', '*?', '??');
            expect(result[0]).to.be.empty;
        });
    });
});


/*
            # wildcard in DG <= in SG
 */
describe('When number of given wildcard in destination glob is equal or fewer than in source glob', function () {
    describe('renamer.rename(names, srcGlob, dstGlob)', function () {
        it('should return computed new name', function () {
            let result = renamer.rename('alx-rose.red', '*', '?');
            expect(result[0]).to.be.empty;

            result = renamer.rename('^$', '??', '?');
            expect(result[0]).to.be.eql('^');

            result = renamer.rename('.', '?*', '?');
            expect(result[0]).to.be.eql('.');

            result = renamer.rename('.', '*?', '?*');
            expect(result[0]).to.be.eql('.');

            result = renamer.rename('.', '*?', '*');
            expect(result[0]).to.be.eql('');
        });
    });
});

/*
            When "names" is a string
 */
describe('When string is passed in "names" argument', function () {
    describe('renamer.rename(names, srcGlob, dstGlob)', function () {
        it('should return a result array with a single element', function () {
            let result = renamer.rename('axl-rose', '*', '*');
            expect(result.length).to.eql(1);
            expect(result[0]).to.eql('axl-rose');

            result = renamer.rename('', '?', '?');
            expect(result.length).to.eql(1);
            expect(result[0]).to.be.empty;
        });
    });
});
