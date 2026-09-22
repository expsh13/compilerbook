#!/usr/bin/env bash
set -eu
cd "$(dirname "$0")"
check_dir=$(mktemp -d /tmp/compilerbook-ch04.XXXXXX)
gcc -std=c11 -Wall -Wextra -Werror -o "$check_dir/parse" parse.c

check_tree() {
    actual=$("$check_dir/parse" "$1")
    if [ "$actual" != "$2" ]; then
        printf '木が一致しません：%s\n期待：%s\n実際：%s\n' "$1" "$2" "$actual" >&2
        exit 1
    fi
}

check_error() {
    status=0
    "$check_dir/parse" "$1" >"$check_dir/output" 2>"$check_dir/error" || status=$?
    test "$status" -eq 1
    test ! -s "$check_dir/output"
    grep -F "$2" "$check_dir/error" >/dev/null
}

check_tree '2+3*4' '(+ 2 (* 3 4))'
check_tree '(2+3)*4' '(* (+ 2 3) 4)'
check_tree '((2+3))*4' '(* (+ 2 3) 4)'
check_tree '9-3-2' '(- (- 9 3) 2)'
check_tree '9-(3-2)' '(- 9 (- 3 2))'
check_tree '8/2/2' '(/ (/ 8 2) 2)'
check_tree '8/(2/2)' '(/ 8 (/ 2 2))'
check_tree '2*(3+4)' '(* 2 (+ 3 4))'
check_tree '3/0' '(/ 3 0)'
check_tree '007' '7'
check_tree '255' '255'
check_tree $' 2\t+\n3 ' '(+ 2 3)'
check_error '9 +' '位置3：数または開き括弧が必要です。'
check_error '(2+3' '位置4：閉じ括弧が必要です。'
check_error '1 2' '位置2：式の後に余分なトークンがあります。'
check_error '-3' '位置0：数または開き括弧が必要です。'
check_error '' '位置0：数または開き括弧が必要です。'
check_error '()' '位置1：数または開き括弧が必要です。'
check_error '2**3' '位置2：数または開き括弧が必要です。'
check_error '2)' '位置1：式の後に余分なトークンがあります。'
check_error '256' '整数は０〜２５５'
check_error '9@3' '位置1：扱えない文字です。'
check_error "$(printf '%01025d' 0)" '１０２４バイトまで'
status=0
"$check_dir/parse" >"$check_dir/output" 2>"$check_dir/error" || status=$?
test "$status" -eq 1
status=0
"$check_dir/parse" 1 2 >"$check_dir/output" 2>"$check_dir/error" || status=$?
test "$status" -eq 1
printf '構文木・優先順位・左結合・括弧・入力エラーを確認しました。\n'
