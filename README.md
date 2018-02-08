 [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
 
# mvmv
A NodeJS package that performs batch renaming and moving of files. It supports globbing [wildcards](http://tldp.org/LDP/GNU-Linux-Tools-Summary/html/x11655.htm) `*` and `?`.

You can use the package by importing it into your NodeJS scripts or as a command on the terminal.

## In-code Usage
```javascript
const mvmv = require('mvmv').create();

mvmv.exec('*.txt', 'temp/*.old');
```

`mvmv.exec(src, dst, cb)` accepts a callback and returns the number of successful files renamed (returns NULL if file not found).

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
  
  mvmv command renames files specified by <source> to destination names specified by <target>.
  The file will not be renamed if a file with the same name already exists.
  mvmv supports * and ? globbing wildcards for specifying file name pattern.
  If wildcards are used, <source> and <target> must be wrapped in quotes, unless on Windows.
  Multiple consecutive * wildcards in <source> are treated as one single * wildcard.
 
 
  Options:
 
    -V, --version      output the version number
    -i, --interactive  Prompts for confirmation before each rename operation.
    -s, --simulate     Dry-runs the rename operations without affecting the file system.
    -v, --verbose      Prints additional operation details.
    -h, --help         output usage information
```

## Caveats
- mvmv does not overwrite existing files.
- mvmv treats consecutive `*` wildcard in the source glob pattern as a single `*`. (This does not apply to the destination glob pattern.)
- globbing patterns must be enclosed in quotes to prevent wildcard expansion by the shell. An alternative is to turn off shell globbing. Please consult this StackOverflow [thread](https://stackoverflow.com/a/22945024) for more information.


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
![mvmv-demo](https://user-images.githubusercontent.com/4752832/35996795-780c4406-0ce5-11e8-8e8b-4a27b1319bf5.png)
