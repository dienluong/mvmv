# mvmv

A NodeJS package that performs batch renaming and moving of files. It supports globbing wildcards `*` and `?`.

You can use the package by importing it into your NodeJS scripts or as a command on the terminal.

### In-code Use
```javascript
const mvmv = require('mvmv').create();

mvmv.exec('*.txt', 'temp/*.old');
```

`mvmv.exec(src, dst, cb)` accepts a callback and returns the number of successful files renamed (returns NULL if file not found).

### Command Line Use
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

### Caveats

- mvmv does not overwrite existing files.
- mvmv treats consecutive `*` in the source glob pattern as a single `*`.

