
## NAME

`sit repo init` - Create local repository.

## SYNOPSIS

```
sit repo init
```

## DESCRIPTION

Create a local repository like git.

## EXAMPLE

```bash
$ sit repo init
created local repo: ./.sit
created dist file: dist/master_data.csv
update files: .sit/scripts/clasp
```

The code is generated as below.

```bash
$ tree .sit
.sit
├── HEAD
├── config
├── logs
│   └── refs
│       ├── heads
│       └── remotes
├── objects
├── refs
│   ├── heads
│   └── remotes
└── scripts
    └── clasp
        ├── Code.js
        ├── RemoteRepo.js
        ├── const.js
        └── util.js

10 directories, 6 files
```
