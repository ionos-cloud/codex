@ionos-cloud/swagman
====================

VDC &amp; SDK swagger management tool

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@ionos-cloud/swagman.svg)](https://npmjs.org/package/@ionos-cloud/swagman)
[![Downloads/week](https://img.shields.io/npm/dw/@ionos-cloud/swagman.svg)](https://npmjs.org/package/@ionos-cloud/swagman)
[![License](https://img.shields.io/npm/l/@ionos-cloud/swagman.svg)](https://github.com/ionos-cloud/swagman/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @ionos-cloud/swagman
$ swagman COMMAND
running command...
$ swagman (-v|--version|version)
@ionos-cloud/swagman/0.0.1 darwin-x64 node-v14.15.4
$ swagman --help [COMMAND]
USAGE
  $ swagman COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`swagman diff FILE1 FILE2`](#swagman-diff-file1-file2)
* [`swagman help [COMMAND]`](#swagman-help-command)
* [`swagman normalize FILE`](#swagman-normalize-file)

## `swagman diff FILE1 FILE2`

compute a diff between two json files, normalizing them first

```
USAGE
  $ swagman diff FILE1 FILE2

ARGUMENTS
  FILE1  first file
  FILE2  second file

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/diff.ts](https://github.com/ionos-cloud/swagman/blob/v0.0.1/src/commands/diff.ts)_

## `swagman help [COMMAND]`

display help for swagman

```
USAGE
  $ swagman help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_

## `swagman normalize FILE`

describe the command here

```
USAGE
  $ swagman normalize FILE

ARGUMENTS
  FILE  file to normalize

OPTIONS
  -h, --help           show CLI help
  -i, --indent=indent  [default: 2]
```

_See code: [src/commands/normalize.ts](https://github.com/ionos-cloud/swagman/blob/v0.0.1/src/commands/normalize.ts)_
<!-- commandsstop -->
