var FilenameGen = require('natural-filename-generator');

var g = new FilenameGen();

for (let i = 0; i < 10; i++) {
    console.log(g.generate(''));
}
