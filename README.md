# sit

[![npm version](https://badge.fury.io/js/%40yukihirop%2Fsit.svg)](https://badge.fury.io/js/%40yukihirop%2Fsit)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

the very very very stupid csv content tracker 🤧

Management for Sheet (ex: GoogleSpreadSheet) like git 😑

## 📦 Installation

```bash
npm install -g @yukihirop/sit
```


## 📖 Usage

```bash
sit -h
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

## ❤️ Support Sheets

- GoogleSpreadSheet

## 📕 Documents

Full docs are available at https://yukihirop.github.io/sit

## ⚙ .sitsetting

The configuration file called `.sitsetting` is a file that contains all settings.

- Schema information file managed by GoogleSpreadSheet.
- Authentication information for using GoogleSpreadSheetAPI.
- Information such as output destination of deliverables.


The default settings are as follows:

```yaml
---
version: "1.0.0"
sheet:
  gss:
    auth:
      credPath: ./creds.json
    openAPIV3Schema:
      type: object
      properties:
        ja:
          type: string
          description: 日本語
        en:
          type: string
          description: 英語
        key:
          type: string
          description: キー
    defaultWorksheet:
      rowCount: 10000
      colCount: 20
repo:
  local: .sit
dist:
  path: ./dist
  sheetName: "master_data.csv"
```

## Development Environment

```bash
$ node -v
v12.13.0

$ npm -v
6.12.0

$ yarn -v
1.19.2
```

## 🤖 Environments Variables

`sit` has environment variables to flexibly set the location of `local repositories` and
`configuration file`, and environment variables required to access `GoogleSpreadSheet`.

|name|content|default|
|----|-------|-------|
|SIT_DIR|Path to local repository|`.`|
|SIT_SETTING_DIR|Path to `.sitsetting`|`.`|
|SIT_GOOGLE_SERVICE_ACCOUNT_EMAIL|Google Service Account Email||
|SIT_GOOGLE_PRIVATE_KEY|Google Private Key||

## 📝 License

This package is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).

## 🤝 Contributing

1. Fork it ( http://github.com/yukihirop/sit/fork )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
