
## NAME

`sit clone` - Clone a repository into a new directory

## SYNOPSIS

```
sit clone [-t, --type <type>] <repository> <sheet_url>
```

## DESCRIPTION

Clones a repository into a newly created directory, creates remote-tracking branches for each branch in the cloned repository

and creates and checks out an initial branch that is forked from the cloned repository’s currently active branch.

## OPTIONS

#### -t, --type \<type\>

Specify the sheet type (default: `GoogleSpreadSheet`)

## EXAMPLE

```bash
$ sit clone origin https://docs.google.com/spreadsheets/d/1jihJ2crH31nrAxFVJtuC6fwlioCi1EbnzMwCDqqhJ7k/edit\#gid\=1795377551
update files: ./.sit/scripts/clasp
Cloning into ... 'dist/master_data.csv'
remote: Total 1
remote: done.
```

For example, `dist/master_data.csv` is created

```csv
日本語,英語,キー
こんにちは,hello,greeting.hello
さようなら,good_bye,greeting.good_bye
歓迎します,wellcome,greeting.welcome
おやすみ,good night,greeting.good_night
```

