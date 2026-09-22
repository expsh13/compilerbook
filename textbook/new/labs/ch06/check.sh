#!/usr/bin/env bash
set -eu
export LC_ALL=C
cd "$(dirname "$0")"
check_dir=$(mktemp -d /tmp/compilerbook-ch06.XXXXXX)
gcc -std=c11 -Wall -Wextra -Werror -O0 -c main.c -o "$check_dir/main.o"
gcc -c answer.s -o "$check_dir/answer.o"
gcc -c answer42.s -o "$check_dir/answer42.o"
nm "$check_dir/main.o" >"$check_dir/main-symbols"
nm "$check_dir/answer.o" >"$check_dir/answer-symbols"
grep -Eq ' U answer$' "$check_dir/main-symbols"
grep -Eq ' T main$' "$check_dir/main-symbols"
grep -Eq ' T answer$' "$check_dir/answer-symbols"
objdump -dr -Mintel "$check_dir/main.o" >"$check_dir/relocations"
grep -Eq 'R_X86_64_.*answer' "$check_dir/relocations"
check_result() {
    gcc "$check_dir/main.o" "$1" -o "$check_dir/program"
    status=0
    "$check_dir/program" || status=$?
    test "$status" -eq "$2"
}
check_result "$check_dir/answer.o" 14
check_result "$check_dir/answer42.o" 42
status=0
gcc "$check_dir/main.o" -o "$check_dir/missing" 2>"$check_dir/missing-error" || status=$?
test "$status" -ne 0
grep -q 'undefined reference.*answer' "$check_dir/missing-error"
status=0
gcc "$check_dir/main.o" "$check_dir/answer.o" "$check_dir/answer42.o" -o "$check_dir/duplicate" 2>"$check_dir/duplicate-error" || status=$?
test "$status" -ne 0
grep -q 'multiple definition.*answer' "$check_dir/duplicate-error"
sed '/^\.globl answer$/d' answer.s >"$check_dir/local.s"
gcc -c "$check_dir/local.s" -o "$check_dir/local.o"
nm "$check_dir/local.o" >"$check_dir/local-symbols"
grep -Eq ' t answer$' "$check_dir/local-symbols"
status=0
gcc "$check_dir/main.o" "$check_dir/local.o" -o "$check_dir/local-program" 2>"$check_dir/local-error" || status=$?
test "$status" -ne 0
grep -q 'undefined reference.*answer' "$check_dir/local-error"
printf '分割コンパイル・シンボル・再配置・部品の交換・未定義と重複のリンクエラーを確認しました。\n'
