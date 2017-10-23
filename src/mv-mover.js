'use strict';
// const globule = require('globule');
const rename    = require('../src/mv-renamer').rename;

function createMover() {
    "use strict";
    return {
        move: moveItems
    };

    function moveItems() {

    }
}

module.exports.create = createMover;
