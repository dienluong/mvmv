 [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
 
# mvmv
A NodeJS package that performs batch renaming and moving of files. It supports globbing [wildcards](http://tldp.org/LDP/GNU-Linux-Tools-Summary/html/x11655.htm) `*` and `?`.

You can use the package by importing it into your NodeJS scripts or as a command on the terminal.

## Motivation
The typical implementations of the linux mv command do not support this rather intuitive usage:
```bash
> mv *.txt *.old
```

## In-code Usage
```javascript
const mvmv = require('mvmv').create();

mvmv.exec('*.txt', 'temp/*.old');
```

`mvmv.exec(src, dst, cb)` accepts a callback and returns the number of successful files moved (returns NULL if file not found).

## Command-line Usage
With package installed globally:
```bash
> mvmv '*.txt' 'temp/*.old'
````

With package installed locally:
```bash
> npx mvmv '*.txt' 'temp/*.old'
```

Execute the `mvmv` command without argument to see the usage information:

```
  Usage: mvmv [options] <source> <target>

  mvmv command moves (or renames) files specified by <source> to destination names specified by <target>.
  mvmv supports * and ? globbing wildcards for specifying file names pattern.
  If wildcards are used, <source> and <target> must be wrapped in quotes.
  Multiple consecutive * wildcards in <source> are treated as one single * wildcard.
  The file will not be moved if a file with the same name already exists at the target location.


  Options:

    -V, --version      output the version number
    -i, --interactive  Prompts for confirmation before each move operation.
    -s, --simulate     Dry-runs the move operations without affecting the file system.
    -v, --verbose      Prints additional operation details.
    -h, --help         output usage information
```

## Caveats
- mvmv does not overwrite existing files.
- mvmv treats consecutive `*` wildcard in the source glob pattern as a single `*`. (This does not apply to the destination glob pattern.)
- globbing patterns on the command line must be enclosed in quotes to prevent wildcard expansion by the shell. An alternative is to turn off shell globbing. Please consult this StackOverflow [thread](https://stackoverflow.com/a/22945024) for more information.


## How It Works
Wildcards in the destination glob pattern correspond to the wildcards of the same type appearing in the source glob pattern, matched by the order in which they appear.

##### Example
```
mvmv '**-*-lines-*?-*?.txt' '*_*-lines-s?e?.txt'
      |  |        |  |       | |        | |
      |  |        |  +-------|-|--------|-+
      |  |        +----------|-|--------+
      |  +-------------------|-+
      +----------------------+
```
(Reminder: consecutive `*` wildcards in the source glob pattern are treated as a single `*`.)

##### Demonstration
![mvmv-demo2](https://user-images.githubusercontent.com/4752832/36003521-7940605c-0cfc-11e8-8d5d-0ad5ab1eba71.png)
