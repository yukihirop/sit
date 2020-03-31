## NAME

`sit reflog` - Manage reflog information

## SYNOPSIS

```
sit reflog
```

## DESCRIPTION

Reference logs, or "reflogs", record when the tips of branches and other references were updated in the local repository.

## OPTIONS

## EXAMPLE

```bash
$ sit reflog
57d67ec HEAD@{0}: checkout: moving from develop to test
57d67ec HEAD@{1}: commit Update master data
015cab1 HEAD@{2}: checkout: moving from hoge to develop
c713351 HEAD@{3}: commit Update master data
0cae686 HEAD@{4}: commit Update master data
7244522 HEAD@{5}: checkout: moving from develop to hoge
015cab1 HEAD@{6}: commit Update master data
255b2b1 HEAD@{7}: checkout: moving from fuga to develop
7244522 HEAD@{8}: checkout: moving from develop to fuga
255b2b1 HEAD@{9}: checkout: moving from master to develop
255b2b1 HEAD@{10}: checkout: moving from hoge to master
7244522 HEAD@{11}: checkout: moving from fuga to hoge
7244522 HEAD@{12}: reset: moving to HEAD
7244522 HEAD@{13}: reset: moving to HEAD
7244522 HEAD@{14}: reset: moving to HEAD
7244522 HEAD@{15}: reset: moving to HEAD
7244522 HEAD@{16}: reset: moving to HEAD
7244522 HEAD@{17}: commit Modify master data
7ad2484 HEAD@{18}: reset: moving to HEAD
7ad2484 HEAD@{19}: reset: moving to HEAD
7ad2484 HEAD@{20}: commit Update master data
8a070ce HEAD@{21}: commit Update master data
e65955b HEAD@{22}: commit Update master data
a96a865 HEAD@{23}: checkout: moving from master to fuga
255b2b1 HEAD@{24}: clone: from https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=1795377551
```
