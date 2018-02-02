# mvmv

A NodeJS package that performs batch renaming and moving of files. It supports globbing wildcards `*` and `?`.

You can use the package by importing it into your NodeJS scripts or as a command on the terminal.

### In-code Use
```javascript
const mvmv = require('mvmv').create();

mvmv.exec('*.txt', 'temp/*.old');
```

`mvmv.exec(src, dst, cb)` accepts a callback and returns the number of successful files renamed (NULL if file not found).

### Command Line Use
With package installed globally:
```bash
> mvmv '*.txt' 'temp/*.old'
````

With package installed locally:
```bash
> npx mvmv '*.txt' 'temp/*.old'
```

Invoke the command without argument to print the usage information.

### Caveats

- mvmv does not overwrite existing files.
- mvmv treats consecutive `*` in the source glob pattern as a single `*`.

