## NAME

`sit remote` - Manage set of tracked repositories

## SYNOPSIS

```
sit remote add [-t, --type] <repository> <url>
sit remote rm [-t, --type] <repository>
sit remote get-url [-t, --type] <repository>
```

## DESCRIPTION

Manage the set of repositories ("remotes") whose branches you track.


## OPTIONS

#### -t, --type

Specify the sheet type (default: `GoogleSpreadSheet`)

## EXAMPLE

#### add

```
$ sit remote add origin https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit\#gid\=1795377551
```

#### rm

```
$ sit remote rm origin
```

#### get-url

```
$ sit remote get-url origin
https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=1795377551
```
