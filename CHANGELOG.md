## v4.0.0
( yes, we start the changelog with v4.0.0 :) )

- yaml support for input specs
- bash and zsh autocompletion

## v4.1.0

- use `x-sdk-patch-level` to store the patch level instead of the version suffix 

## v5.0.0

- apply only the last patch that it is not present in the upstream
- get patch level from API version OR vendor extension

## v5.0.1

- bug-fix: perform diff even if semantic option is not set
