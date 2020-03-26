## NAME

`sit stash` - Stash the changes in a dirty working directory away

## SYNOPSIS

```
sit stash save [<message>]
sit stash apply [<stash>]
sit stash pop [<stash>]
sit stash list
sit stash show <-p, --print> [<stash>]
sit stash drop [<stash>]
```

## DESCRIPTION

Use `sit stash` when you want to record the current state of the working directory and the index, but want to go back to a clean

working directory. The command saves your local modifications away and reverts the working directory to match the `HEAD` commit.


## COMMANDS

#### save [\<message\>]

Save your local modifications to a new stash entry and roll them back to HEAD (in the working tree and in the index).

The `<message>` part is optional and gives the description along with the stashed state.

#### apply [\<stash\>]

Like `pop`, but do not remove the state from the stash list. Unlike `pop`

#### pop [\<stash\>]

Remove a single stashed state from the stash list and apply it on top of the current working tree state, i.e., do the inverse operation of `sit stash push`.

#### list

List the stash entries that you currently have. Each stash entry is listed with its name (e.g. `stash@{0}` is the latest entry, `stash@{1}` is the one before, etc.), the name of the branch that was current when the entry was made, and a short description of the commit the entry was based on.

```
6aa9d62 stash@{0}: On dev-1: WIP
f96dc44 stash@{1}: WIP on dev-6: 1a66eae Update master data
```

#### show <-p, --print> [\<stash\>]

Show the changes recorded in the stash entry as a diff between the stashed contents and the commit back when the stash entry was first created.

#### drop [\<stash\>]

Remove a single stash entry from the list of stash entries.

## EXAMPLE

#### save [\<message\>]

```
$ sit stash save "WIP"
Saved working directory and index state On develop: WIP
```

#### apply [\<stash\>]

```
$ sit stash apply stash@{0}
On branch develop
Changes not staged for commit:

	modified:	dist/master_data.csv

no changes added to commit
```

#### pop [\<stash\>]

```
$ sit stash pop stash@{0}
On branch develop
Changes not staged for commit:

	modified:	dist/master_data.csv

Dropped stash@{0} (8cc693abc8ebe3be982f2c9d2cccca2faf41440e)
```

#### list

```
$ sit stash list
6aa9d62 stash@{0}: On dev-1: WIP
f96dc44 stash@{1}: WIP on dev-6: 1a66eae Update master data
6fd586a stash@{2}: On dev-6: hogehoge
c8a3571 stash@{3}: On dev-6: hogehoge
57045d6 stash@{4}: On dev-6: stash message
a2ab5c8 stash@{5}: WIP on dev-6: 1a66eae Update master data
```

#### show -p(--print) [\<stash>\]

```bash
$ sit stash show -p stash@{2}
Index: cfce404..fa5878e
===================================================================
--- a/dist/master_data.csv
+++ b/dist/master_data.csv
@@ -2,5 +2,5 @@
 こんにちは,hello,common.greeting.hello
 さようなら,goodbye,common.greeting.good_bye
 おやすみなさい,good_night,common.greeting.good_night
 バイバイ,bye bye,common.byebye
-ブイブイ,bui bui,common.buibui
\ No newline at end of file
+fjaijfpioajfoajpofjaiojfoi
\ No newline at end of file

```

#### drop [\<stash\>]

```bash
$ sit stash drop stash@{3}
Dropped stash@{3} (c8a35711a19840a6a6d4e464c94c4dc3b5e25d61)
```
