//http://stackoverflow.com/a/25580289
var glob = require('glob');

function createParser () {
    const opts = {
        nobrace: true,
        noglobstar: true,
        noext: true,
        nodir: true
    };

    return {
        resolve: function (patterns) {
            //returns array of string for the matches, or empty array if no match
            var results = glob.sync(patterns, opts);
            console.log(results);
            return results;
        }
    };
}

module.exports.create = createParser;
