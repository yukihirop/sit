## NAME

`sit status` - Show the working tree status

## SYNOPSIS

```
sit status
```

## DESCRIPTION

Displays paths that have differences between the dist file and the current HEAD commit.

## EXAMPLE

#### no changes

```bash
$ sit status
On branch hoge
nothing to commit
```

#### changes

```bash
$ sit status
On branch hoge

	modified: dist/master_data.csv

no changes added to commit
```
