## NAME

`sit rev-parse` - Pick out and massage parameters

## SYNOPSIS

```
sit rev-parse [--short] | [--show-toplevel] <args>
```

## DESCRIPTION

Many Sit porcelainish commands take mixture of flags

## OPTIONS

#### --short

shortens the object name to a unique prefix with at least length characters.

#### --show-toplevel

Show the absolute path of the top-level directory of the working tree. If there is no working tree, report an error.

## EXAMPLE

#### basic

```
$ sit rev-parse HEAD
57d67ec294ddd192683f8d81abb40a373bfbb887
```

#### --short

```bash
$ sit rev-parse --short HEAD
57d67ec
```

#### --show-toplevel

```bash
$ sit rev-parse --show-toplevel
/Users/fukudayu/JavaScripts/sit/.sit
```
