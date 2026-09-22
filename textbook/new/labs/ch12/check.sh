#!/usr/bin/env bash
set -eu
export LC_ALL=C
cd "$(dirname "$0")"
check_dir=$(mktemp -d /tmp/compilerbook-ch12.XXXXXX)
gcc -std=c11 -Wall -Wextra -Werror -c main.c -o "$check_dir/main.o"
gcc -std=c11 -Wall -Wextra -Werror -c answer.c -o "$check_dir/answer.o"
ar rcs "$check_dir/libanswer.a" "$check_dir/answer.o"
gcc "$check_dir/main.o" "$check_dir/libanswer.a" -o "$check_dir/archive-app"
gcc -fPIC -shared -Wl,-soname,libanswer.so answer.c -o "$check_dir/libanswer.so"
gcc "$check_dir/main.o" -L"$check_dir" -lanswer -Wl,-rpath,'$ORIGIN' -o "$check_dir/shared-app"
test "$("$check_dir/archive-app")" = 7
test "$("$check_dir/shared-app")" = 7
nm "$check_dir/archive-app" | grep -E ' T answer$'
nm -D "$check_dir/shared-app" | grep -E ' U answer$'
readelf -d "$check_dir/shared-app" | grep 'libanswer.so'
if readelf -d "$check_dir/archive-app" | grep -q 'libanswer.so'; then exit 1; fi
sha256sum "$check_dir/archive-app" "$check_dir/shared-app" > "$check_dir/before"
gcc -fPIC -shared -DVALUE=42 -Wl,-soname,libanswer.so answer.c -o "$check_dir/libanswer.so"
test "$("$check_dir/archive-app")" = 7
test "$("$check_dir/shared-app")" = 42
sha256sum "$check_dir/archive-app" "$check_dir/shared-app" > "$check_dir/after"
cmp "$check_dir/before" "$check_dir/after"
mv "$check_dir/libanswer.so" "$check_dir/libanswer.hidden"
if "$check_dir/shared-app" >"$check_dir/out" 2>"$check_dir/error"; then exit 1; fi
test ! -s "$check_dir/out"
grep 'libanswer.so' "$check_dir/error"
test "$("$check_dir/archive-app")" = 7
mv "$check_dir/libanswer.hidden" "$check_dir/libanswer.so"
test "$("$check_dir/shared-app")" = 42
printf '静的な取り込み・動的な参照・ライブラリ差し替え・欠落時の失敗を確認しました。\n'
