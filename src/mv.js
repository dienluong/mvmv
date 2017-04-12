var DefaultParser = require('../src/mv-parser');

module.exports.create = function create() {
    var parser = DefaultParser.create();

    return {
        run: function () {
            "use strict";
            parseArg(process.argv[2]);
        },

        init: function(p) {
            "use strict";
            parser = p || parser;
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
};
