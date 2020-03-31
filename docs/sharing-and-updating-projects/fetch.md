## NAME

`sit fetch` - Download objects and refs from another repository

## SYNOPSIS

```
sit fetch  [--prune] <repository> [branch]
```

## DESCRIPTION

Fetch branches and/or tags (collectively, "refs") from one or more other repositories, along with the objects necessary to complete their histories. Remote-tracking branches are updated

## OPTIONS

#### --prune

List both remote-tracking branches and local branches.

## EXAMPLE

#### basic

```bash
$ sit fetch origin master
remote: Total 1
From https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=1795377551
  * branch		master	-> FETCH_HEAD
  78fa659..f9be004	master	-> origin/master
```

#### --prune

```bash
$ node index.js fetch --prune origin
From https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=1795377551
* [new branch]		test		-> origin/test
* [new branch]		fix_bugs		-> origin/fix_bugs
- [deleted]		(none)		-> origin/hoge
- [deleted]		(none)		-> origin/fuga
```
