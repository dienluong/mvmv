'use strict';

const fs            = require('fs');
const readline      = require('readline');
const Mv            = require('../src/mv');
const commandLine   = require('commander');
const defaultMover  = require('../src/mv-mover').create();

const interactiveMover = {
    commit: function commit(src, dst) {
        let successList = [];
        let readStdin = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        src.forEach(function (oldName, idx) {
            let newName = dst[idx];
            readStdin.question(`Sure to rename ${oldName} to ${newName}? (y/n)`, (answer) => {
                if (answer === 'y') {
                    if (defaultMover.commit([oldName], [newName]).length) {
                        successList.push(idx);
                    }
                }

                readStdin.close();
            });
        });

        return successList;
    }
};

const simulateMover = {
    commit: function commit(src, dst) {
        let successList = [];

        src.forEach(function (oldName, idx) {
            if (fs.existsSync(dst[idx])) {
                console.log(`   Unable to rename ${oldName} to ${dst[idx]}: ${dst[idx]} already exists.`);
            }
            else {
                console.log(`   Renaming ${oldName} to ${dst[idx]}`);
                successList.push(idx);
            }
        });

        return successList;
    }
};

const verboseMover = {
    commit: function commit(src, dst) {
        src.forEach(function (oldName, idx) {
            console.log(`   Renaming ${oldName} to ${dst[idx]}`);
        });

        return defaultMover.commit(src, dst);
    }
};

function run () {
    let myMover = defaultMover;
    let result;

    commandLine
    .version('0.1.0')
    .option('-i, --interactive', 'Prompts for confirmation before each rename operation.')
    .option('-s, --simulate', 'Dry-runs the rename operations without affecting the file system.')
    .option('-v, --verbose', 'Prints more detailed execution output.')
    .parse(process.argv);

    if (commandLine.args.length !== 2) {
// console.log('myApp DEBUG: ' + process.argv);
// console.log('myApp DEBUG: ' + commandLine.args);
        commandLine.outputHelp();
        return;
    }

    const srcGlob = commandLine.args[0];
    const dstGlob = commandLine.args[1];
    console.log('\x1b[36mSource:\x1b[0m %s  \x1b[36mDestination\x1b[0m: %s', srcGlob, dstGlob);

// console.log('commandLine.simulate: ' + commandLine.simulate);
// console.log('commandLine.verbose: ' + commandLine.verbose);
// console.log('commandLine.interactive: ' + commandLine.interactive);
    if (commandLine.simulate) {
console.log('Simulate...');
        myMover = simulateMover;
    }
    else if (commandLine.verbose) {
console.log('Verbose...');
        myMover = verboseMover;
    }
    else if (commandLine.interactive) {
console.log('Interactive...');
        myMover = interactiveMover;
    }

    const myMvApp = Mv.create(null, null, myMover);
    try {
        result = myMvApp.exec(srcGlob, dstGlob);
    }
    catch (e) {
        console.log(e.message);
    }

    if (result === null) {
        console.log(`File not found.`);
    }
    else {
        console.log(`\x1b[36mRenamed ${result} file(s)\x1b[0m`);
    }
}

//run();
module.exports.run = run;
