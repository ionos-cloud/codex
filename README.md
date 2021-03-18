@ionos-cloud/swagman
====================

VDC &amp; SDK swagger management tool

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![CI](https://github.com/ionos-cloud/codex/actions/workflows/ci.yml/badge.svg)](https://github.com/ionos-cloud/codex/actions/workflows/ci.yml)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @ionos-cloud/codex
$ codex COMMAND
running command...
$ codex (-v|--version|version)
@ionos-cloud/codex/1.0.2 darwin-x64 node-v14.15.4
$ codex --help [COMMAND]
USAGE
  $ codex COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`codex commit`](#codex-commit)
* [`codex compile`](#codex-compile)
* [`codex diff FILE1 FILE2`](#codex-diff-file1-file2)
* [`codex edit`](#codex-edit)
* [`codex help [COMMAND]`](#codex-help-command)
* [`codex init`](#codex-init)
* [`codex lock`](#codex-lock)
* [`codex login`](#codex-login)
* [`codex normalize FILE`](#codex-normalize-file)
* [`codex patch`](#codex-patch)
* [`codex status`](#codex-status)
* [`codex unlock`](#codex-unlock)
* [`codex update`](#codex-update)

## `codex commit`

commit changes into the patch being edited

```
USAGE
  $ codex commit

OPTIONS
  -d, --debug
  -h, --help             show CLI help
  -m, --message=message
  -v, --version=version  [default: 5]
```

_See code: [src/commands/commit.ts](https://github.com/ionos-cloud/codex/blob/v1.0.2/src/commands/commit.ts)_

## `codex compile`

compile baseline plus all the patches

```
USAGE
  $ codex compile

OPTIONS
  -d, --debug
  -h, --help             show CLI help
  -o, --output=output
  -v, --version=version  [default: 5]
```

_See code: [src/commands/compile.ts](https://github.com/ionos-cloud/codex/blob/v1.0.2/src/commands/compile.ts)_

## `codex diff FILE1 FILE2`

compute a diff between two json files, normalizing them first

```
USAGE
  $ codex diff FILE1 FILE2

ARGUMENTS
  FILE1  first file
  FILE2  second file

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/diff.ts](https://github.com/ionos-cloud/codex/blob/v1.0.2/src/commands/diff.ts)_

## `codex edit`

describe the command here

```
USAGE
  $ codex edit

OPTIONS
  -a, --abort
  -d, --debug
  -h, --help             show CLI help
  -o, --output=output
  -p, --patch=patch
  -v, --version=version  [default: 5]
```

_See code: [src/commands/edit.ts](https://github.com/ionos-cloud/codex/blob/v1.0.2/src/commands/edit.ts)_

## `codex help [COMMAND]`

display help for codex

```
USAGE
  $ codex help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_

## `codex init`

initialize a codex project in the current directory

```
USAGE
  $ codex init

OPTIONS
  -d, --debug
  -h, --help             show CLI help
  -v, --version=version  [default: 5]
  --vdc-host=vdc-host    vdc host

EXAMPLE
  $ codex init
```

_See code: [src/commands/init.ts](https://github.com/ionos-cloud/codex/blob/v1.0.2/src/commands/init.ts)_

## `codex lock`

acquire the global codex lock

```
USAGE
  $ codex lock

OPTIONS
  -d, --debug
  -h, --help   show CLI help

EXAMPLE
  $ codex lock
```

_See code: [src/commands/lock.ts](https://github.com/ionos-cloud/codex/blob/v1.0.2/src/commands/lock.ts)_

## `codex login`

authenticate using the Inside credentials

```
USAGE
  $ codex login

OPTIONS
  -d, --debug
  -h, --help               show CLI help
  -p, --password=password  password to login with
  -u, --username=username  username to login with

EXAMPLE
  $ codex login
```

_See code: [src/commands/login.ts](https://github.com/ionos-cloud/codex/blob/v1.0.2/src/commands/login.ts)_

## `codex normalize FILE`

describe the command here

```
USAGE
  $ codex normalize FILE

ARGUMENTS
  FILE  file to normalize

OPTIONS
  -h, --help           show CLI help
  -i, --indent=indent  [default: 2]
```

_See code: [src/commands/normalize.ts](https://github.com/ionos-cloud/codex/blob/v1.0.2/src/commands/normalize.ts)_

## `codex patch`

listing patches or editing their description

```
USAGE
  $ codex patch

OPTIONS
  -d, --debug
  -h, --help             show CLI help
  -l, --list
  -m, --message=message
  -n, --number=number    patch to set message for; defaults to last patch
  -v, --version=version  [default: 5]
```

_See code: [src/commands/patch.ts](https://github.com/ionos-cloud/codex/blob/v1.0.2/src/commands/patch.ts)_

## `codex status`

display status information

```
USAGE
  $ codex status

OPTIONS
  -d, --debug
  -h, --help             show CLI help
  -r, --reset
  -v, --version=version  [default: 5]

EXAMPLE
  $ codex status
```

_See code: [src/commands/status.ts](https://github.com/ionos-cloud/codex/blob/v1.0.2/src/commands/status.ts)_

## `codex unlock`

forcefully release the lock

```
USAGE
  $ codex unlock

OPTIONS
  -d, --debug
  -h, --help   show CLI help

EXAMPLE
  $ codex unlock
```

_See code: [src/commands/unlock.ts](https://github.com/ionos-cloud/codex/blob/v1.0.2/src/commands/unlock.ts)_

## `codex update`

update baseline from vdc

```
USAGE
  $ codex update

OPTIONS
  -c, --check            check if there's an update without actually performing the update
  -d, --debug            show debug information
  -h, --help             show CLI help
  -o, --output=output
  -v, --version=version  [default: 5] swagger version to work on
  -y, --yes              answer yes to all questions; useful in CI automation
  --vdc-host=vdc-host    vdc host
```

_See code: [src/commands/update.ts](https://github.com/ionos-cloud/codex/blob/v1.0.2/src/commands/update.ts)_
<!-- commandsstop -->
