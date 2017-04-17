var path    = require('path');
var glToRe  = require('glob-to-regexp');
var mm      = require('micromatch');

function englobbed(paths, glob) {
    "use strict";
    if (!Array.isArray(paths)) {
        throw new TypeError('Expects an array of paths.');
    }

    return paths.map(function (p) {
        try {
            var basename = path.basename(p);

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
            let tmpStr = re.source.replace(/[^\\]\.(?!\*)/g, '(.)');
            tmpStr = tmpStr.replace(/\.\*/g, '(.*)');
            re = new RegExp(tmpStr);
            console.log('Gl-toRe Mod: ' + re);

            let re2 = mm.makeRe(glob);
            console.log('Micromatch    :' + re2);
            re2 = new RegExp(re2.source.replace('(?:', '('));
            console.log('Micromatch mod:' + re2);

            console.log("gltoRe:\n");
            console.log(p.match(re));

            let match2 = p.match(re2);
            console.log("Micromatch:\n");
            console.log(match2);
            console.log('\n');

            return match2;
        }
        catch(e) {
            // console.log(e.message);
            return { error: e.message };
        }
    })
}

module.exports =  exports = englobbed;
