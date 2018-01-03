#!/usr/bin/env node

'use strict';

const fs            = require('fs');
const path          = require('path').posix;
const readlineSync  = require('readline-sync');
const commandLine   = require('commander');
const Mv            = require('../src/mv');
const Mover         = require('../src/mv-mover').create();

let currentMode = '';

const defaultMover = {
    commit: function commit(src, dst) {
        return Mover.commit(src, dst, null, (err) => {
            if (err) {
                printWithMode(err.message);
            }
        });
    }
};

const interactiveMover = {
    commit: function commit(src, dst) {
        let successList = [];

        src.forEach(function confirmAndCommit(oldName, idx) {
            let newName = dst[idx];
            const answerBool = readlineSync.keyInYN(`Sure to rename \x1b[37;1m${oldName}\x1b[0m to \x1b[37;1m${newName}\x1b[0m ? `);
// console.log('readlineSync: ' + answerBool);
            if (answerBool) {
                let resultArr = Mover.commit([oldName], [newName], null, (err) => {
                    if (err) {
                        printWithMode(`${err.message}`);
                    }
                });

                if (resultArr.length) {
                    successList.push(idx);
                }
            }
        });

        return successList;
    }
};

const simulateMover = {
    commit: function commit(srcNames, dstNames) {
        let successList = [];
        let newNamesList = [];

        srcNames.forEach(function simulateCommit(srcName, idx) {
            if (!fs.existsSync(path.dirname(dstNames[idx]))) {
                // Cannot rename if destination path does not exist
                printWithMode(`No such file or directory '${dstNames[idx]}'`);
            }
            else {
                if (!fs.existsSync(dstNames[idx]) && !newNamesList.includes(dstNames[idx])) {
                    printWithMode(`Renamed \x1b[37;1m${srcName}\x1b[0m to \x1b[37;1m${dstNames[idx]}\x1b[0m`);
                    newNamesList.push(dstNames[idx]);
                    successList.push(idx);
                }
                else {
                    printWithMode(`Skipping rename of '${srcName}': '${dstNames[idx]}' already exists.`);
                }
            }
        });

        return successList;
    }
};

const verboseMover = {
    commit: function commit(src, dst) {
        let successList = [];

        src.forEach(function verboseCommit(srcName, idx) {
            let resultArr = Mover.commit([srcName], [dst[idx]], null, (err, oldName, newName) => {
                if (err) {
                    printWithMode(`${err.message}`);
                }
                else {
                    printWithMode(`Renamed \x1b[37;1m${oldName}\x1b[0m to \x1b[37;1m${newName}\x1b[0m`);
                }
            });

            if (resultArr.length) {
                successList.push(idx);
            }
        });

        return successList;
    }
};

function printWithMode(message) {
    let mode = '';
    if (currentMode === 'Simulate') {
        mode = `[${currentMode}] `;
    }
    message = mode + message;

    console.log(message);
}

function run () {
    let myMover = defaultMover;
    let result;

    commandLine
    .version('0.1.0')
    .description('mvjs command renames files named by <source> to destination names specified by <target>.\n' +
        '  mvjs supports * and ? globbing wildcards for specifying file name pattern.\n' +
        '  If wildcards are used, <source> or <target> must be wrapped in quotes, unless on Windows.')
    .option('-i, --interactive', 'Prompts for confirmation before each rename operation.')
    .option('-s, --simulate', 'Dry-runs the rename operations without affecting the file system.')
    .option('-v, --verbose', 'Prints additional operation details.')
    .arguments('<source> <target>')
    .parse(process.argv);
    // .usage('[options] <source> <target>')
    // .action(processArguments)

    if (commandLine.args.length !== 2) {
// console.log('myApp DEBUG: ' + process.argv);
// console.log('myApp DEBUG: ' + commandLine.args);
        commandLine.outputHelp();
        return;
    }

    if (commandLine.simulate) {
        currentMode = 'Simulate';
        myMover = simulateMover;
    }
    else if (commandLine.interactive) {
        currentMode = 'Interactive';
        myMover = interactiveMover;
    }
    else if (commandLine.verbose) {
        currentMode = 'Verbose';
        myMover = verboseMover;
    }

    const srcGlob = commandLine.args[0];
    const dstGlob = commandLine.args[1];
    printWithMode(`\x1b[36mSource:\x1b[0m ${srcGlob}  \x1b[36mDestination\x1b[0m: ${dstGlob}`);

    const myMv = Mv.create(null, null, myMover);
    try {
        result = myMv.exec(srcGlob, dstGlob);
    }
    catch (e) {
        console.log(`Error: ${e.message}`);
        return;
    }

    if (result === null) {
        printWithMode(`File not found.`);
    }
    else if (Number.isFinite(result)) {
        printWithMode(`\x1b[36mRenamed ${result} file(s)\x1b[0m`);
    }
}

// Comment this when unit testing
run();
// Uncomment below when unit testing
// module.exports.run = run;
