## NAME

`sit merge` - Join two or more development histories together

## SYNOPSIS

```
sit merge [--continue] | [--stat] | [--abort]
```

## DESCRIPTION

Incorporates changes from the named commits (since the time their histories diverged from the current branch) into the current branch.

## OPTIOINS

#### --stat

Show a diffstat at the end of the merge.

#### --abort

Abort the current conflict resolution process, and try to reconstruct the pre-merge state.

#### --continue

After a `sit merge` stops due to conflicts you can conclude the merge by running `sit merge --continue`

## EXAMPLE

#### basic

```bash
$ sit fetch origin dev-1
remote: Total 1
From https://docs.google.com/spreadsheets/d/1tkNrlcDws5KlBzt8DVAU0Xu97tPHy9dIOHYZrT_YtPs/edit#gid=2010045482
  * branch		develop	-> FETCH_HEAD
  a59011d..1be1927	dev-1	-> origin/develop
```

If conflicting

```
$ sit merge origin develop
Two-way-merging dist/master_data.csv
CONFLICT (content): Merge conflict in dist/master_data.csv
two-way-merge failed; fix conflicts and then commit the result.
```

#### --stat

```
$ sit merge --stat
fatal: You have not concluded your merge (MERGE_HEAD exists)
Please, commit your changes before you merge.
```

#### --continue

If not merging

```
$ sit merge --continue
fatal: There is no merge in progress (MERGE_HEAD missing)
```

If merging,

```
$ node index.js merge --continue
hint: Waiting for your editor to close the file...
```

Open with the editor specified by the environment variable `EDITOR`

![image](https://user-images.githubusercontent.com/11146767/77658194-ae2c6780-6fb9-11ea-9999-c25c0c0f14ba.png)

#### --abort

```
sit merge --abort
```
