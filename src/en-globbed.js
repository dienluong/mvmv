var path    = require('path');
var glToRe  = require('glob-to-regexp');
// var mm      = require('micromatch');

function englobbed(paths, glob) {
    "use strict";
    if (!Array.isArray(paths)) {
        throw new TypeError('Expects an array of paths.');
    }
    // ---------------------------------------------------------------
    // Extracts literal, i.e. non-wildcard, portions of the glob
    /*            var literals = glob.match(/[^*?]+/g);
     var separator = '';

     if (literals) {
     separator = `(?:${literals[0]}`;

     for (let i = 1; i < literals.length; i++) {
     separator += `|${literals[i]}`;
     }

     separator += ')';
     }

     console.log('Separator: ' + separator);*/
    // ---------------------------------------------------------------


    let re = glToRe(glob, {extended: true});
    console.log('Gl-to-Re:    ' + re);
    // Add capture group for regex '.'
    let tmpStr = re.source.replace(/\./g, function (match, offset, source) {
        // if "\.", then it's a literal '.', return
        if (offset && (source[offset - 1] === '\\')) {
            return match;
        }
        // if ".*", then return
        if (source[offset + 1] === '*') {
            return match;
        }

        // Only enclose in capture group '.' that is not part of "\." or ".*"
        return (`(${match})`);
    });

    console.log('tmpStr: ' + tmpStr);
    // Add capture group for regex '.*'
    tmpStr = tmpStr.replace(/\.\*/g, '($&)');
    console.log('tmpStr: ' + tmpStr);
    // Add capture group for substrings not already enclosed in capture group...
    tmpStr = tmpStr.replace(/([^\*\(\)\$\^]+(?![\*\)]))/g, '($&)');
    console.log('tmpStr: ' + tmpStr);
    re = new RegExp(tmpStr);
    console.log('Gl-to-Re Mod: ' + re);

    // let re2 = mm.makeRe(glob);
    // console.log('Micromatch    :' + re2);
    // re2 = new RegExp(re2.source.replace('(?:', '('));
    // console.log('Micromatch mod:' + re2);

    return paths.map(function (p) {
        try {
            var basename = path.basename(p);

            console.log("gltoRe:\n");
            let match = basename.match(re);
            console.log(match);

            // let match2 = p.match(re2);
            // console.log("Micromatch:\n");
            // console.log(match2);
            // console.log('\n');

            return match;
        }
        catch(e) {
            // console.log(e.message);
            return { error: e.message };
        }
    })
}

module.exports =  exports = englobbed;
