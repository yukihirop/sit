## NAME

`sit config` - Get and set repository or global options

## SYNOPSIS

```
sit config [options] <key> <value>

configure sitconfig

Options:
  --global    global setting
  --local     local setting
  -h, --help  output usage information
```

## DESCRIPTION

You can query/set/replace/unset options with this command.

The name is actually the section and the key separated by a dot, and the value will be escaped.

## EXAMPLE

#### --local

```bash
$ sit config --local user.name yukihirop
$ sit config --local user.email yukihirop@example.com
```

```
$ cat .sit/config
[user]
name=yukihirop
email=yukihirop@example.com

[remote.origin]
type=GoogleSpreadSheet
url="https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=1795377551"
fetch=+refs/heads/*:refs/remotes/origin/*

[branch.master]
remote=origin
merge=refs/heads/master
```

#### --global

```bash
$ sit config --global user.name yukihirop
$ sit config --global user.email yukihirop@example.com
```

```bash
$ cat ~/.sitconfig
[user]
name=yukihirop
email=yukihirop@example.com
```
