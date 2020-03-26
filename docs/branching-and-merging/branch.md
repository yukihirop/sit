## NAME

`sit branch` - List or delete branches

## SYNOPSIS

```
sit branch [-a, --all] |
           [-D, --deleteBranch <deleteBranch>] |
           [-m, --moveBranch <moveBranch>] |
           [-h, --help]
```

## DESCRIPTION

List or delete branches.

## OPTIONS

#### -a, --all

List both remote-tracking branches and local branches.

#### -D, --deleteBranch

Delete a branch.

#### -m, --moveBranch

Move/rename a branch and the corresponding reflog.

## EXAMPLE

#### basic

```
$ sit branch
* develop
  hoge
  master
  test
  fuga
```

#### -a, --all

```bash
$ sit branch -a
* develop
  fuga
  master
  hoge
  test
  remotes/origin/develop
  remotes/origin/master
  remotes/origin/fix_bugs
  remotes/origin/test
```

#### -D, --deleteBranch

```bash
$ sit branch -D hoge
Deleted branch hoge ( was c713351)
```

#### -m, --moveBranch

```
$ sit branch -m bar
```
