## NAME

`sit` - the very very very stupid csv content tracker

## SYNOPSIS

```
sit [--version] | [--help]
```

## DESCRIPTION

Sit is a fast, scalable, distributed revision control system with an unusually rich command set that provides both high-level

operations and full access to internals.

## EXAMPLE

#### --version

```bash
$ sit --version
1.0.0
```

#### --help

```bash
$ sit -help
Usage: sit [options] [command]

sit cli

Options:
  -V, --version                                     output the version number
  -h, --help                                        output usage information

Commands:
  cat-file [options] <hash>                         cat sit objects
  hash-object [options] <path>                      compute hash sit object
  branch [options]                                  operate branch
  checkout [options] [repository] [name]            checkout branch
  status                                            status dist file
  diff                                              diff dist file
  commit [options]                                  commit dist file
  push [options] <repository> <branch>              push rows into Sheet
  fetch [options] <repository> [branch]             fetch rows from Sheet
  merge [options] [repository] [branch]             merge rows
  clone [options] <repository> <url>                clone rows from sheet
  browse-remote [repository]                        browse remote repository
  config [options] <key> <value>                    configure sitconfig
  remote [options] <subcommand> <repository> [url]  set sitconfig
  log [options]                                     Shows the commit logs
  reflog                                            Shows the ref logs
  show-ref                                          Show refs
  rev-parse [options] [args]                        Many Sit porcelainish commands take mixture of flags
  pull-request [options] <repository> <args>        Create pull request in Sheet
  init                                              create setting file (.sitsetting)
  clasp                                             clasp cli
  repo                                              repo cli
  stash                                             stash cli
```
