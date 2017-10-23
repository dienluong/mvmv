'use strict';

var DefaultParser = require('../src/mv-parser');
var DefaultMover  = require('../src/mv-mover');

module.exports.create = function createMv() {
    var parser = DefaultParser.create();
    var mover  = DefaultMover.create();
    var fileList = [];
    const srcPattern = process.argv[2];
    const dstPattern = process.argv[3];

    return {
        run: function () {
            "use strict";
            fileList = parseArg(srcPattern);
            moveFile(fileList, dstPattern);

        },

        init: function(p, m) {
            "use strict";
            parser = p || parser;
            mover = m || mover;
        }
    };

    function parseArg (arg) {
        try {
            return parser.resolve(arg);
        }
        catch(e) {
            console.log('Error parsing arguments: ' + e);
            throw e;
        }
    }

    function moveFile (list, pattern) {
        try {
            mover.move(list, pattern);
        }
        catch(e) {
            console.log('Error moving items: ' + e);
            throw e;
        }
    }
};
