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
@ionos-cloud/swagman/0.0.0 darwin-x64 node-v14.15.4
$ swagman --help [COMMAND]
USAGE
  $ swagman COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`swagman commit`](#swagman-commit)
* [`swagman compile`](#swagman-compile)
* [`swagman diff FILE1 FILE2`](#swagman-diff-file1-file2)
* [`swagman edit`](#swagman-edit)
* [`swagman help [COMMAND]`](#swagman-help-command)
* [`swagman init`](#swagman-init)
* [`swagman normalize FILE`](#swagman-normalize-file)
* [`swagman patch`](#swagman-patch)
* [`swagman status`](#swagman-status)
* [`swagman update`](#swagman-update)

## `swagman commit`

commit changes into the patch being edited

```
USAGE
  $ swagman commit

OPTIONS
  -d, --debug
  -h, --help             show CLI help
  -m, --message=message
  -v, --version=version  [default: 5]
```

_See code: [src/commands/commit.ts](https://github.com/ionos-cloud/swagman/blob/v0.0.0/src/commands/commit.ts)_

## `swagman compile`

compile baseline plus all the patches

```
USAGE
  $ swagman compile

OPTIONS
  -d, --debug
  -h, --help             show CLI help
  -o, --output=output
  -v, --version=version  [default: 5]
```

_See code: [src/commands/compile.ts](https://github.com/ionos-cloud/swagman/blob/v0.0.0/src/commands/compile.ts)_

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

_See code: [src/commands/diff.ts](https://github.com/ionos-cloud/swagman/blob/v0.0.0/src/commands/diff.ts)_

## `swagman edit`

describe the command here

```
USAGE
  $ swagman edit

OPTIONS
  -a, --abort
  -d, --debug
  -h, --help             show CLI help
  -o, --output=output
  -p, --patch=patch
  -v, --version=version  [default: 5]
```

_See code: [src/commands/edit.ts](https://github.com/ionos-cloud/swagman/blob/v0.0.0/src/commands/edit.ts)_

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

## `swagman init`

initialize a swagman project in the current directory

```
USAGE
  $ swagman init

OPTIONS
  -d, --debug
  -h, --help             show CLI help
  -v, --version=version  [default: 5]
  --vdc-host=vdc-host    vdc host

EXAMPLE
  $ swagman init
```

_See code: [src/commands/init.ts](https://github.com/ionos-cloud/swagman/blob/v0.0.0/src/commands/init.ts)_

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

_See code: [src/commands/normalize.ts](https://github.com/ionos-cloud/swagman/blob/v0.0.0/src/commands/normalize.ts)_

## `swagman patch`

listing patches or editing their description

```
USAGE
  $ swagman patch

OPTIONS
  -d, --debug
  -h, --help             show CLI help
  -l, --list
  -m, --message=message
  -n, --number=number    patch to set message for; defaults to last patch
  -v, --version=version  [default: 5]
```

_See code: [src/commands/patch.ts](https://github.com/ionos-cloud/swagman/blob/v0.0.0/src/commands/patch.ts)_

## `swagman status`

display status information

```
USAGE
  $ swagman status

OPTIONS
  -d, --debug
  -h, --help             show CLI help
  -r, --reset
  -v, --version=version  [default: 5]

EXAMPLE
  $ swagman status
```

_See code: [src/commands/status.ts](https://github.com/ionos-cloud/swagman/blob/v0.0.0/src/commands/status.ts)_

## `swagman update`

update baseline from vdc

```
USAGE
  $ swagman update

OPTIONS
  -c, --check            check if there's an update without actually performing the update
  -d, --debug            show debug information
  -h, --help             show CLI help
  -o, --output=output
  -v, --version=version  [default: 5] swagger version to work on
  -y, --yes              answer yes to all questions; useful in CI automation
  --vdc-host=vdc-host    vdc host
```

_See code: [src/commands/update.ts](https://github.com/ionos-cloud/swagman/blob/v0.0.0/src/commands/update.ts)_
<!-- commandsstop -->
