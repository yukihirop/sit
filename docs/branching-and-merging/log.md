## NAME

`sit log` - Show commit logs

## SYNOPSIS

```
sit log [--oneline]
```

## DESCRIPTION

Shows the commit logs.


## OPTIONS

#### --oneline

Shows the commit logs oneline.

## EXAMPLE

#### basic

```bash
$ sit log
commit a59011ddf998935862253cb6690add50d533c5fa (HEAD -> dev-1)
Author: yukihirop <te108186@gmail.com>
Date: Sun Mar 0 14:56:23 2020 +0900 +0900

	Update master data

commit 89f9d004b5cb3df82a48624eaf5d302593bea93c
Author: yukihirop <te108186@gmail.com>
Date: Sun Mar 0 14:54:37 2020 +0900 +0900

	Merge from GoogleSpreadSheet/dev-1

```

#### --oneline

```
$ sit log --oneline
a59011d (HEAD -> dev-1) Update master data
89f9d00 Merge from GoogleSpreadSheet/dev-1
```
