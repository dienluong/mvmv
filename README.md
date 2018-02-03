# mvmv
A NodeJS package that performs batch renaming and moving of files. It supports globbing wildcards `*` and `?`.

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

Demonstration:
```
> ls -al
-rw-r--r--   1 user  staff     0B  3 Feb 15:57 curly-howard-lines-s2-e2.txt
-rw-r--r--   1 user  staff     0B  3 Feb 15:57 larry-fine-lines-season1-episode3.txt
-rw-r--r--   1 user  staff     0B  3 Feb 15:57 moe-howard-lines-s04-ep01.txt

> mvmv -v '**-*-lines-*?-*?.txt' '*_*-lines-s?e?.txt'
Source: **-*-lines-*?-*?.txt  Destination: *_*-lines-s?e?.txt
Renamed curly-howard-lines-s2-e2.txt to curly_howard-lines-s2e2.txt
Renamed larry-fine-lines-season1-episode3.txt to larry_fine-lines-s1e3.txt
Renamed moe-howard-lines-s04-ep01.txt to moe_howard-lines-s4e1.txt
Renamed 3 file(s)

> ls -al
-rw-r--r--   1 user  staff     0B  3 Feb 15:57 curly_howard-lines-s2e2.txt
-rw-r--r--   1 user  staff     0B  3 Feb 15:57 larry_fine-lines-s1e3.txt
-rw-r--r--   1 user  staff     0B  3 Feb 15:57 moe_howard-lines-s4e1.txt

```
