var globule = require('globule');

function createMover() {
    "use strict";
    return {
        move: moveItems
    };

    function moveItems (items, srcPattern, dstPattern) {
    }
}

module.exports.create = createMover;
