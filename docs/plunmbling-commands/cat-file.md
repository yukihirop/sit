## NAME

`sit cat-file` - Provide content or type and size information for repository objects

## SYNOPSIS

```
sit cat-file [-t, --type] | [-s, --size] | [-p, --print] <object>
```

## DESCRIPTION

In its first form, the command provides the content or the type of an object in the repository.

## OPTIONS

#### -t, --type

Instead of the content, show the object type identified by <object>.

#### -s, --size

Instead of the content, show the object size identified by <object>.

#### -p, --print

Pretty-print the contents of <object> based on its type.

## EXAMPLE

#### -t, --type

```bash
$ sit cat-file -t HEAD
commit
```

```bash
$ sit cat-file -t 8f2caa26dcde5a2df28976a5ab96209bbc1b420e
blob
```

#### -s, --size

```bash
$ sit cat-file -s HEAD
232
```

#### -p, --print

```bash
$ sit cat-file -p HEAD
blob 8f2caa26dcde5a2df28976a5ab96209bbc1b420e
parent 015cab1c1a2993687ce114e89e5b352e4b73a6df
author yukihirop <te108186@gmail.com> 1585271995803 +0900
committer yukihirop <te108186@gmail.com> 1585271995803 +0900

Update master data
```
