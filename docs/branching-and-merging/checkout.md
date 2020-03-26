## NAME

`sit checkout` - Switch branches or restore working tree files

## SYNOPSIS

```
sit checkout [-b, --branch <new_branch>]
```

## DESCRIPTION

Updates files in the working tree to match the version in the index or the specified tree.

If no pathspec was given, `sit checkout` will also update `HEAD` to set the specified branch as the current branch.


!> `^,@,\0,!,?,*` and `[pr] *` cannot be used in the name of `<new_branch>`.

## OPTIONS

#### -b, --branch <new_branch>

Create a new branch named `<new_branch>`

## EXAMPLE

#### Checkout new branch

```bash
$ sit checkout -b develop
Switched to a new branch 'develop'
```

#### Checkout exist branch

```bash
$ sit checkout master
Switched to branch 'master'
```
