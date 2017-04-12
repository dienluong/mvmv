var filenameGen = require('natural-filename-generator');

var g = new filenameGen();

for (let i = 0; i < 10; i++) {
    console.log(g.generate(''));
}
