#!/usr/bin/env bash
set -eu
cd "$(dirname "$0")"
check_dir=$(mktemp -d /tmp/compilerbook-ch10.XXXXXX)
for optimization in 0 2; do
    gcc -std=c11 -Wall -Wextra -Werror -O"$optimization" inspect.c memory.s -o "$check_dir/inspect"
    "$check_dir/inspect" all >"$check_dir/output"
    for expected in \
        '読み出し前：a=7、*p=7' \
        '機械語で読み出す値=7' \
        '書き込み後：a=42、*p=42、*q=42' \
        '１要素の幅=8、配列全体=24' \
        'p[1]=20、*(p+1)=20、機械語=20' \
        'p+1 と p の差=1 要素' \
        '変更前：文字列=ABC、配列の大きさ=4、文字列の長さ=3' \
        '４バイト=65,66,67,0' \
        '変更後：文字列=A、配列の大きさ=4、文字列の長さ=1' \
        '残っている text[2]=C' \
        '返された文字列=ABC、最初のバイト=65'; do
        grep -Fx "$expected" "$check_dir/output" >/dev/null
    done
    for mode in address array string literal; do
        "$check_dir/inspect" "$mode" >"$check_dir/part"
        test -s "$check_dir/part"
    done
done
gcc -c memory.s -o "$check_dir/memory.o"
objdump -s -j .rodata "$check_dir/memory.o" >"$check_dir/data"
grep -q '41424300' "$check_dir/data"
sed "s/text\[1\] = .*;/text[1] = 'X';/; s/strlen(text) == 1/strlen(text) == 3/" inspect.c >"$check_dir/changed.c"
gcc -std=c11 -Wall -Wextra -Werror "$check_dir/changed.c" memory.s -o "$check_dir/changed"
"$check_dir/changed" string >"$check_dir/changed-output"
grep -Fx '変更後：文字列=AXC、配列の大きさ=4、文字列の長さ=3' "$check_dir/changed-output" >/dev/null
printf 'アドレス・間接読み書き・配列の要素幅・文字列の終端・静的データを確認しました。\n'
