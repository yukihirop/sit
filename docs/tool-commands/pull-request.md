## NAME

`sit pull-request` - Create pull request in Sheet

## SYNOPSIS

```
sit pull-request <repository> <to_branch>...<from_branch>
```

## DESCRIPTION

Create pull request from `<repository>/<from_branhc>` to `<repository>/<to_branch>` in Sheet. like this

![image](https://user-images.githubusercontent.com/11146767/77715952-56751700-7020-11ea-8b39-68c6a587f420.png)

|symbol|description|
|----|-----------|
|+|added|
|-|deleted|
|±|to_branch only|

|name|description|
|----|-----------|
|`created at`|Creation date|
|`reviewers`|Write a reviewer|
|`assignees`|The person who created this PR|
|`message`|Write a complete message so you can see the corrections made in this PR|
|`labels`|Please use it freely|
|`projects`|Please use it freely|
|`milestone`|Please use it freely|

## EXAMPLE

```bash
$ sit pull-request origin master...develop
Total 1
remote:
remote: Create a pull request for 'master' from 'develop' on GoogleSpreadSheet by visiting:
remote:     https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=1795377551
remote:
To https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=1795377551
	Please look at sheet: '[pr] master...develop' in GoogleSpreadSheet
```
