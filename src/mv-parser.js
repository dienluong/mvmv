//http://stackoverflow.com/a/25580289
var glob = require('glob');

function createParser () {
    return {
        resolve: function (patterns) {
            //returns array of string for the matches, or empty array if no match
            var results = glob.sync(patterns, {noglobstar: true, nodir: true});
            console.log(results);
            return results;
        }
    };
}

module.exports.create = createParser;
