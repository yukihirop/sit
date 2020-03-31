## NAME

`sit hash-object` - Compute object ID and optionally creates a blob from a file

## SYNOPSIS

```
sit hash-object
```

## DESCRIPTION

Computes the object ID value for an object with specified type with the contents of the named file (which can be outside of the work tree), and optionally writes the resulting object into the object database. Reports its object ID to its standard output. When <type> is not specified, it defaults to "blob".

## OPTIONS

#### -t, --type \<type\>

Specify the type (default: "blob")

#### -w, --write

Actually write the object into the object database.

## EXAMPLE

#### basic

```
$ sit hash-object dist/master_data.csv
8f2caa26dcde5a2df28976a5ab96209bbc1b420e
```

#### -t, --type \<type\>

```
$ sit hash-object -t commit dist/commit.txt
57d67ec294ddd192683f8d81abb40a373bfbb887
```

#### -w, --write

```bash
$ sit hash-object -t commit dist/commit.txt
57d67ec294ddd192683f8d81abb40a373bfbb887
```
