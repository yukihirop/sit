## NAME

`sit diff` - Show changes between commits

## SYNOPSIS

```
sit diff
```

## DESCRIPTION

Show changes changes between two blob objects.

## EXAMPLE

```bash
$ sit diff
Index: 8f2caa2..be50bef
===================================================================
--- a/dist/master_data.csv
+++ b/dist/master_data.csv
@@ -1,5 +1,6 @@
 日本語,英語,キー
 こんにちは,hello,greeting.hello
 さようなら,good_bye,greeting.good_bye
 歓迎します,wellcome,greeting.welcome
-おやすみ,good night,greeting.good_night
\ No newline at end of file
+おやすみ,good night,greeting.good_night
+ばいばい,bye bye,greeting.bye_bye
\ No newline at end of file

```
