## NAME

`sit show-ref` - List references in a local repository

## SYNOPSIS

```
sit show-ref
```

## DESCRIPTION

Displays references available in a local repository along with the associated commit IDs. Results can be filtered using a pattern and tags can be dereferenced into object IDs. Additionally, it can be used to test whether a particular ref exists.

## EXAMPLE

```
$ sit show-ref
16ffcdedb7cf9a7cdebf4e42f828c8d60a2229be refs/stash
57d67ec294ddd192683f8d81abb40a373bfbb887 refs/heads/develop
7244522cc23ea1bb73a526b60cae62a17e8fa7e0 refs/heads/fuga
c713351e6990a01a6b56f04e1a3dbe4fdb2ed199 refs/heads/hoge
57d67ec294ddd192683f8d81abb40a373bfbb887 refs/heads/test
255b2b1479e29a4c5d181f21b79166f2afb39bef refs/heads/master
57d67ec294ddd192683f8d81abb40a373bfbb887 refs/remotes/origin/develop
2c601afa297a89300705ca8b6fca89c70553070f refs/remotes/origin/fix_bugs
f9be004b50c13e35c733a8981e37e7c8533c21b4 refs/remotes/origin/master
57d67ec294ddd192683f8d81abb40a373bfbb887 refs/remotes/origin/test
```
