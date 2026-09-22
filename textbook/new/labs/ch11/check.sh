#!/usr/bin/env bash
set -eu
export LC_ALL=C
cd "$(dirname "$0")"
check_dir=$(mktemp -d /tmp/compilerbook-ch11.XXXXXX)
gcc -std=c11 -Wall -Wextra -Werror -O0 -fno-common -fno-pie -no-pie layout.c -o "$check_dir/layout"
sha256sum "$check_dir/layout" >"$check_dir/before"
"$check_dir/layout" >"$check_dir/output"
"$check_dir/layout" >"$check_dir/again"
cmp "$check_dir/output" "$check_dir/again"
sha256sum "$check_dir/layout" >"$check_dir/after"
cmp "$check_dir/before" "$check_dir/after"
for expected in \
    '開始時：seed=7、zeros=0、文字列=ABC' \
    'ゼロ領域=65536 バイト、先頭=0、末尾=0' \
    '関数呼び出し：count=1、local=8' \
    '関数呼び出し：count=2、local=9' \
    '変更後：seed=42、zeros=9、末尾=1'; do
    grep -Fx "$expected" "$check_dir/output" >/dev/null
done
nm "$check_dir/layout" >"$check_dir/symbols"
grep -Eq ' D seed$' "$check_dir/symbols"
grep -Eq ' B zeros$' "$check_dir/symbols"
grep -Eq ' B reserve$' "$check_dir/symbols"
grep -Eq ' R label$' "$check_dir/symbols"
readelf -SW "$check_dir/layout" >"$check_dir/sections"
grep -Eq '\.bss +NOBITS' "$check_dir/sections"
readelf -lW "$check_dir/layout" >"$check_dir/segments"
found=0
while read -r kind offset virtual physical filesz memsz rest; do
    if [ "$kind" = LOAD ] && (( memsz > filesz )); then found=1; fi
done <"$check_dir/segments"
test "$found" -eq 1
gcc -std=c11 -Wall -Wextra -Werror -O0 -fno-common -fno-pie -no-pie -DRESERVE=1048576 layout.c -o "$check_dir/large"
"$check_dir/large" >"$check_dir/large-output"
grep -Fx 'ゼロ領域=1048576 バイト、先頭=0、末尾=0' "$check_dir/large-output" >/dev/null
small_size=$(wc -c <"$check_dir/layout")
large_size=$(wc -c <"$check_dir/large")
test "$((large_size - small_size))" -lt 65536
printf '初期値・ゼロ領域・関数内の初期化・再起動・ファイル不変・セクションとセグメントを確認しました。\n'
