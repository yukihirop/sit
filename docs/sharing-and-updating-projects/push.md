## NAME

`sit push` - Update remote refs along with associated objects

## SYNOPSIS

```
sit push  [-f, --force] <repository> <branch>
```

## DESCRIPTION

Updates remote refs using local refs, while sending objects necessary to complete the given refs.


## OPTIONS

#### -f, --force

Usually, the command refuses to update a remote ref that is not an ancestor of the local ref used to overwrite it.

## EXAMPLE

#### basic

```bash
$ sit push origin test
Writed objects: 100% (1/1)
Total 1
remote:
remote: Create a pull request for test on GoogleSpreadSheet by visiting:
remote:     https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=1795377551
remote:
To https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=1795377551
	1d4bcf9..57d67ec  test -> test
```

If rejected

```bash
$ sit push origin develop
To https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=1795377551
! [rejected]		develop -> develop (non-fast-forward)
error: failed to push some refs to 'https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=1795377551'
hint: Updates wre rejected because the tip of your current branch is behind
hint: its remote counterpart. Integrate the remote changes (e.q.
hint: 'sit pull ...' before pushing again.
hint: See the 'Note abount fast-forwards' in 'sit push --help' for details.
```

#### -f, --force

```bash
$ sit push --force origin develop
Writed objects: 100% (1/1)
Total 1
remote:
remote: Create a pull request for develop on GoogleSpreadSheet by visiting:
remote:     https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=1795377551
remote:
To https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit#gid=1795377551
	+ 015cab1..57d67ec  develop -> develop (forced update)
```
