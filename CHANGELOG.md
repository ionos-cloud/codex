## v5.0.5

- enhancement: make `-m` flag for `codex commit` required

## v5.0.4

- bug-fix: apply the last patch, when the patch level is higher than upstream level and when they are equal, if the baseline was not updated

## v5.0.3

- bug-fix: apply the last patch, revert latest changes

## v5.0.2

- bug-fix: apply the last patch even if it is deployed in upstream and the baseline is not updated yet

## v5.0.1

- bug-fix: apply the last patch even if it is deployed in upstream
- bug-fix: perform diff even if semantic option is not set

## v5.0.0

- apply only the last patch that it is not present in the upstream
- get patch level from API version OR vendor extension

## v4.1.0

- use `x-sdk-patch-level` to store the patch level instead of the version suffix

## v4.0.0
( yes, we start the changelog with v4.0.0 :) )

- yaml support for input specs
- bash and zsh autocompletion
