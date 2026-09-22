#!/usr/bin/env bash
set -eu
export LC_ALL=C
cd "$(dirname "$0")"
check_dir=$(mktemp -d /tmp/compilerbook-ch13.XXXXXX)
for source in types parameters; do
    gcc -std=c11 -Wall -Wextra -Werror -pedantic "$source.c" -o "$check_dir/$source"
    "$check_dir/$source" > "$check_dir/$source.out"
done
grep -Fx '配列の要素=20、配列へのポインタ経由=20' "$check_dir/types.out"
grep -Fx '配列=24、ポインタ=8、指す配列=12' "$check_dir/types.out"
grep -Fx '関数ポインタ=14、別名経由=14、返った先=20' "$check_dir/types.out"
grep -Fx '呼び出し元の配列=12' "$check_dir/parameters.out"
grep -Fx '関数内のポインタ=8' "$check_dir/parameters.out"
grep -Fx '変更後=10,99,77' "$check_dir/parameters.out"
for mode in ARRAY_OF_FUNCTIONS RETURN_ARRAY POINTER_TYPE CONST_VALUE CONST_POINTER; do
    if gcc -std=c11 -Wall -Wextra -Werror -pedantic -fsyntax-only -D"$mode" rejected.c >"$check_dir/$mode.log" 2>&1; then
        printf '拒否されるはずの宣言が通りました：%s\n' "$mode"
        exit 1
    fi
done
printf '型の構造・関数ポインタ・配列引数・５種類の診断を確認しました。\n'
