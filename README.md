@ionos-cloud/codex
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
@ionos-cloud/codex/2.1.5 darwin-x64 node-v16.0.0
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
* [`codex config [PATH] [VALUE]`](#codex-config-path-value)
* [`codex diff FILE1 FILE2`](#codex-diff-file1-file2)
* [`codex edit`](#codex-edit)
* [`codex help [COMMAND]`](#codex-help-command)
* [`codex init`](#codex-init)
* [`codex lock`](#codex-lock)
* [`codex login`](#codex-login)
* [`codex normalize FILE`](#codex-normalize-file)
* [`codex patch`](#codex-patch)
* [`codex sdk-changes`](#codex-sdk-changes)
* [`codex status`](#codex-status)
* [`codex unlock`](#codex-unlock)
* [`codex update`](#codex-update)

## `codex commit`

commit changes into the patch being edited

```
USAGE
  $ codex commit

OPTIONS
  -d, --debug            show debug information
  -h, --help             show CLI help
  -m, --message=message
```

_See code: [src/commands/commit.ts](https://github.com/ionos-cloud/codex/blob/v2.1.5/src/commands/commit.ts)_

## `codex compile`

compile baseline plus all the patches

```
USAGE
  $ codex compile

OPTIONS
  -d, --debug            show debug information
  -h, --help             show CLI help
  -o, --output=output
  -v, --version=version  [default: 5]
```

_See code: [src/commands/compile.ts](https://github.com/ionos-cloud/codex/blob/v2.1.5/src/commands/compile.ts)_

## `codex config [PATH] [VALUE]`

codex configuration management

```
USAGE
  $ codex config [PATH] [VALUE]

ARGUMENTS
  PATH   configuration setting path e.g. 'auth.username'
  VALUE  configuration value

OPTIONS
  -d, --debug  show debug information
  -h, --help   show CLI help

EXAMPLES
  $ codex config
  $ codex config foo.bar
  $ codex config foo.bar value
```

_See code: [src/commands/config.ts](https://github.com/ionos-cloud/codex/blob/v2.1.5/src/commands/config.ts)_

## `codex diff FILE1 FILE2`

compute a diff between two json files, normalizing them first

```
USAGE
  $ codex diff FILE1 FILE2

ARGUMENTS
  FILE1  first file
  FILE2  second file

OPTIONS
  -d, --debug          show debug information
  -h, --help           show CLI help
  -i, --ignore=ignore  ignore node
  -s, --semantic       perform a swagger semantic diff
  -y, --yaml           yaml
```

_See code: [src/commands/diff.ts](https://github.com/ionos-cloud/codex/blob/v2.1.5/src/commands/diff.ts)_

## `codex edit`

edit the swagger file after applying all patches or edit a specific patch

```
USAGE
  $ codex edit

OPTIONS
  -a, --abort
  -d, --debug            show debug information
  -h, --help             show CLI help
  -o, --output=output
  -p, --patch=patch
  -v, --version=version  [default: 5]
```

_See code: [src/commands/edit.ts](https://github.com/ionos-cloud/codex/blob/v2.1.5/src/commands/edit.ts)_

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

initialize a codex project in S3

```
USAGE
  $ codex init

OPTIONS
  -d, --debug            show debug information
  -h, --help             show CLI help
  -v, --version=version  [default: 5]
  --vdc-host=vdc-host    vdc host

EXAMPLE
  $ codex init
```

_See code: [src/commands/init.ts](https://github.com/ionos-cloud/codex/blob/v2.1.5/src/commands/init.ts)_

## `codex lock`

acquire the global codex lock

```
USAGE
  $ codex lock

OPTIONS
  -d, --debug  show debug information
  -h, --help   show CLI help

EXAMPLE
  $ codex lock
```

_See code: [src/commands/lock.ts](https://github.com/ionos-cloud/codex/blob/v2.1.5/src/commands/lock.ts)_

## `codex login`

authenticate using the Inside credentials

```
USAGE
  $ codex login

OPTIONS
  -d, --debug              show debug information
  -h, --help               show CLI help
  -p, --password=password  password to login with
  -u, --username=username  username to login with

EXAMPLE
  $ codex login
```

_See code: [src/commands/login.ts](https://github.com/ionos-cloud/codex/blob/v2.1.5/src/commands/login.ts)_

## `codex normalize FILE`

take a minified json file a produce an indented version of it

```
USAGE
  $ codex normalize FILE

ARGUMENTS
  FILE  file to normalizeFile

OPTIONS
  -h, --help           show CLI help
  -i, --indent=indent  [default: 2]
```

_See code: [src/commands/normalize.ts](https://github.com/ionos-cloud/codex/blob/v2.1.5/src/commands/normalize.ts)_

## `codex patch`

list, remove or display patches or edit their description

```
USAGE
  $ codex patch

OPTIONS
  -d, --debug            show debug information
  -g, --get=get          display the contents of the specified patch
  -h, --help             show CLI help
  -l, --list             list all the patches
  -m, --message=message
  -n, --number=number    patch to set message for; defaults to last patch
  -o, --output=output    save patch to the specified file
  -r, --rm=rm            remove the specified patch
  -v, --version=version  [default: 5]
```

_See code: [src/commands/patch.ts](https://github.com/ionos-cloud/codex/blob/v2.1.5/src/commands/patch.ts)_

## `codex sdk-changes`

display changes brought in by the SDK patches

```
USAGE
  $ codex sdk-changes

OPTIONS
  -d, --debug            show debug information
  -h, --help             show CLI help
  -v, --version=version  [default: 5]

EXAMPLE
  $ codex sdk-changes
```

_See code: [src/commands/sdk-changes.ts](https://github.com/ionos-cloud/codex/blob/v2.1.5/src/commands/sdk-changes.ts)_

## `codex status`

display status information

```
USAGE
  $ codex status

OPTIONS
  -d, --debug            show debug information
  -h, --help             show CLI help
  -r, --reset
  -v, --version=version  [default: 5]

EXAMPLE
  $ codex status
```

_See code: [src/commands/status.ts](https://github.com/ionos-cloud/codex/blob/v2.1.5/src/commands/status.ts)_

## `codex unlock`

forcefully release the lock

```
USAGE
  $ codex unlock

OPTIONS
  -d, --debug  show debug information
  -h, --help   show CLI help

EXAMPLE
  $ codex unlock
```

_See code: [src/commands/unlock.ts](https://github.com/ionos-cloud/codex/blob/v2.1.5/src/commands/unlock.ts)_

## `codex update`

update baseline from vdc

```
USAGE
  $ codex update

OPTIONS
  -c, --check            check if there's an update without actually performing the update
  -d, --debug            show debug information
  -h, --help             show CLI help
  -o, --output=output    (required)
  -v, --version=version  [default: 5] swagger version to work on
  -y, --yes              answer yes to all questions; useful in CI automation
  --vdc-host=vdc-host    vdc host
```

_See code: [src/commands/update.ts](https://github.com/ionos-cloud/codex/blob/v2.1.5/src/commands/update.ts)_
<!-- commandsstop -->
