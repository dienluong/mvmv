# Test Cases

## Number of Results
1. Number of match results should match the number of capture groups

## Multiple Paths Specified
1. Returns an array of matches (or an empty array if no match), for each path.

## Characters in Filename
1. Supports filename with "("
2. Supports filename with multiple "."

## Multiple Wildcards
1. Supports the use of a mix of * and ? within same glob pattern.
2. Supports the use of multiple *
3. Supports the use of multiple ?

## Literal Matches
1. Works even if * matches zero character
2. Works even when there are multiple literals in the glob pattern


# Notes

## File Systems Guide
https://nodejs.org/en/docs/guides/working-with-different-filesystems/
