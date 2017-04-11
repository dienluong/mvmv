module.exports.create = function create() {
    var parser = null;

    return {
        run: function () {
            "use strict";

        },

        init: function(p) {
            "use strict";
            parser = p;
        }
    };

    function parseArgs (args) {
        try {
            return parser.parse(args);
        }
        catch(e) {
            console.log('Error trying to parse arguments: ' + e);
        }
    }
};

