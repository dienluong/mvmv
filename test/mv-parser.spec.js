var path    = require('path');
var expect  = require('chai').expect;
var sinon   = require('sinon');
var myParser  = require('../src/mv-parser');

const txtFileNames = [ 'test/test-data/4911339-know-sudan-2017-04-11-drama.txt',
    'test/test-data/burundi_such_sm_help.txt',
    'test/test-data/ethiopia-492795-military-buenos-aires.txt',
    'test/test-data/faq-pretoria-moreover.txt',
    'test/test-data/guides_small_guinea_2017-04-11_astana.txt',
    'test/test-data/italy-jobs-wipe.txt',
    'test/test-data/marshall-islands_billy-preston_bottom_17.txt',
    'test/test-data/religion-nigeria.txt',
    'test/test-data/sports-divine-8499096-putrajaya.txt',
    'test/test-data/turkey-2784-drama.txt'
];

describe('mv-parser', function () {
    describe('resolve()', function () {
        beforeEach(function () {
            this.parser = myParser.create();
            sinon.spy(this.parser, 'resolve');

        });

        afterEach(function () {
            this.parser.resolve.restore();
        });

        it('should return [] when none matched', function () {
            this.parser.resolve(path.join('test-data', '*.bob'));
            expect(this.parser.resolve.returned([])).to.be.true;
        });

        it('should return array of file names matching glob pattern', function () {
            var fileList = this.parser.resolve(path.join('test', 'test-data', '*.txt'));
            expect(fileList).to.eql(txtFileNames);
        });
    });
});
