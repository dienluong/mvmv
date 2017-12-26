'use strict';

const fs            = require('fs');
const readlineSync  = require('readline-sync');
const commandLine   = require('commander');
const Mv            = require('../src/mv');
const defaultMover  = require('../src/mv-mover').create();

let currentMode = '';

const interactiveMover = {
    commit: function commit(src, dst) {
        // let readStdin = readline.createInterface({
        //     input: process.stdin,
        //     output: process.stdout
        // });
        let successList = [];

        src.forEach(function confirmAndCommit(oldName, idx) {
            let newName = dst[idx];
            const answerBool = readlineSync.keyInYN(`    Sure to rename \x1b[37;1m${oldName}\x1b[0m to \x1b[37;1m${newName}\x1b[0m ? `);
// console.log('readlineSync: ' + answerBool);
            if (answerBool) {
                if (defaultMover.commit([oldName], [newName]).length) {
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
            // TODO: enhance checking of already existing files by saving list of new names.
            if (!fs.existsSync(dstNames[idx]) && !newNamesList.includes(dstNames[idx])) {
                printWithMode(`    Renamed \x1b[37;1m${srcName}\x1b[0m to \x1b[37;1m${dstNames[idx]}\x1b[0m`);
                newNamesList.push(dstNames[idx]);
                successList.push(idx);
            }
            else {
                printWithMode(`    Skipping rename of '${srcName}': '${dstNames[idx]}' already exists.`);
            }
        });

        return successList;
    }
};

const verboseMover = {
    commit: function commit(src, dst) {
        let successList = [];

        src.forEach(function verboseCommit(srcName, idx) {
            let result = defaultMover.commit([srcName], [dst[idx]], null, (err, oldName, newName) => {
                if (err) {
                    printWithMode(`    ${err.message}`);
                }
                else {
                    printWithMode(`    Renamed \x1b[37;1m${oldName}\x1b[0m to \x1b[37;1m${newName}\x1b[0m`);
                }
            });

            if (result.length) {
                successList.push(idx);
            }
        });

        return successList;
    }
};

function printWithMode(message) {
    let mode = '';
    if (currentMode) {
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
    .option('-i, --interactive', 'Prompts for confirmation before each rename operation.')
    .option('-s, --simulate', 'Dry-runs the rename operations without affecting the file system.')
    .option('-v, --verbose', 'Prints additional operation details.')
    .parse(process.argv);

    if (commandLine.args.length !== 2) {
// console.log('myApp DEBUG: ' + process.argv);
// console.log('myApp DEBUG: ' + commandLine.args);
        commandLine.outputHelp();
        return;
    }

// console.log('commandLine.simulate: ' + commandLine.simulate);
// console.log('commandLine.verbose: ' + commandLine.verbose);
// console.log('commandLine.interactive: ' + commandLine.interactive);
    if (commandLine.simulate) {
        currentMode = 'Simulate';
        myMover = simulateMover;
    }
    else if (commandLine.verbose) {
        currentMode = 'Verbose';
        myMover = verboseMover;
    }
    else if (commandLine.interactive) {
        currentMode = 'Interactive';
        myMover = interactiveMover;
    }

    const srcGlob = commandLine.args[0];
    const dstGlob = commandLine.args[1];
    printWithMode(`\x1b[36mSource:\x1b[0m ${srcGlob}  \x1b[36mDestination\x1b[0m: ${dstGlob}`);

    const myMvApp = Mv.create(null, null, myMover);
    try {
        result = myMvApp.exec(srcGlob, dstGlob);
    }
    catch (e) {
        console.log(e.message);
    }

    if (result === null) {
        printWithMode(`File not found.`);
    }
    else {
        printWithMode(`\x1b[36mRenamed ${result} file(s)\x1b[0m`);
    }
}

// Comment this when unit testing
// run();
// Uncomment below when unit testing
module.exports.run = run;
