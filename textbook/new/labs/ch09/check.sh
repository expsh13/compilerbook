#!/usr/bin/env bash
set -eu
cd "$(dirname "$0")"
check_dir=$(mktemp -d /tmp/compilerbook-ch09.XXXXXX)
for optimization in 0 2; do
    gcc -std=c11 -Wall -Wextra -Werror -O"$optimization" inspect.c integers.s -o "$check_dir/inspect"
    "$check_dir/inspect" all >"$check_dir/output"
    for expected in \
        '01111111：符号なし=127、符号あり=127' \
        '10000000：符号なし=128、符号あり=-128' \
        '11111110：符号なし=254、符号あり=-2' \
        '11111111：符号なし=255、符号あり=-1' \
        'ゼロ拡張：値=255、１６進=00000000000000ff' \
        '符号拡張：値=-1、１６進=ffffffffffffffff' \
        'eax に１を書いた後の rax=1' \
        'Ｃの a+1=256、８ビット符号なしへ変換後=0' \
        '８ビット加算 255+1：結果=0、ＣＦ=1、ＯＦ=0' \
        '８ビット加算 127+1：結果=128、ＣＦ=0、ＯＦ=1'; do
        grep -Fx "$expected" "$check_dir/output" >/dev/null
    done
    for mode in bits extend register convert add; do
        "$check_dir/inspect" "$mode" >"$check_dir/part"
        test -s "$check_dir/part"
        while IFS= read -r line; do
            grep -Fx "$line" "$check_dir/output" >/dev/null
        done <"$check_dir/part"
    done
done
for value in 300 -2; do
    gcc -std=c11 -Wall -Wextra -Werror -DRESULT="$value" exit-value.c -o "$check_dir/exit-value"
    status=0
    "$check_dir/exit-value" >"$check_dir/exit-output" || status=$?
    expected_status=44
    if [ "$value" -eq -2 ]; then expected_status=254; fi
    test "$status" -eq "$expected_status"
    grep -Fx "main が返す値=$value" "$check_dir/exit-output" >/dev/null
done
printf '符号・拡張・レジスタ幅・８ビット加算のフラグ・整数変換・終了状態を確認しました。\n'
