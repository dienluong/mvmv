# mvmv

A NodeJS package that performs batch renaming and moving of files that supports shell glob wildcards.  You can use it by importing it into your code or use it as a command on the terminal.

### In-code Use
```
const mvmv = require('mvmv').create();

mvmv.exec('*.txt', 'temp/*.old');
```

`mvmv.exec(src, dst, cb)` accepts a callback and returns the number of successful files renamed (NULL if file not found).

### Command Line Use
With package installed globally:
````
> mvmv '*.txt' 'temp/*.old'
````

With package installed locally:
```
> npx mvmv '*.txt' 'temp/*.old'
```

Invoke the command without argument to print the usage information.
