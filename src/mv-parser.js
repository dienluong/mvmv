//http://stackoverflow.com/a/25580289
var glob = require('glob');

function createParser () {
    return {
        resolve: function (patterns) {
            return glob.sync(patterns);
        }
    };
}

module.exports.create = createParser;
