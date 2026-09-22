#!/usr/bin/env bash
set -eu
cd "$(dirname "$0")"
check_dir=$(mktemp -d /tmp/compilerbook-ch05.XXXXXX)
gcc -std=c11 -Wall -Wextra -Werror -o "$check_dir/compiler" compiler.c
check_result() {
    "$check_dir/compiler" "$1" >"$check_dir/result.s"
    gcc -o "$check_dir/program" "$check_dir/result.s"
    status=0
    "$check_dir/program" || status=$?
    if [ "$status" -ne "$2" ]; then
        printf '結果が一致しません：%s（期待 %s、実際 %s）\n' "$1" "$2" "$status" >&2
        exit 1
    fi
}
check_result '0' 0
check_result '007' 7
check_result '255' 255
check_result '2+3*4' 14
check_result '(2+3)*4' 20
check_result '(2+3)*(4+5)' 45
check_result '9-3-2' 4
check_result '9-(3-2)' 8
check_result '8/3' 2
check_result '8/2/2' 2
check_result '8/(2/2)' 8
check_result '(0-9)/2+10' 6
check_result '9/(0-2)+10' 6
check_result '(0-9)/(0-2)' 4
check_result '200+100' 44
check_result '3-5' 254
check_result '20-(2+3)*(8/2)' 0
check_result $' 2\t+\n3 ' 5
for invalid in '' '()' '9 +' '(2+3' '1 2' '-3' '2**3' '2)' '256' '9@3'; do
    status=0
    "$check_dir/compiler" "$invalid" >"$check_dir/output" 2>"$check_dir/error" || status=$?
    test "$status" -eq 1
    test ! -s "$check_dir/output"
    test -s "$check_dir/error"
done
printf '四則演算・優先順位・括弧・負の途中結果・終了状態・入力エラーを確認しました。\n'
