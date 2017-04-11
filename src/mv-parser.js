var fs = require('fs');
var glob = require('glob'); //http://stackoverflow.com/a/25580289

function createParser () {
    return {
        resolve: function (patterns) {
            return glob.sync(patterns);
        }
    };
}

module.exports.create = createParser;
