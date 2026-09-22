#!/usr/bin/env bash
set -eu
cd "$(dirname "$0")"
check_dir=$(mktemp -d /tmp/compilerbook-ch07.XXXXXX)
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
check_result 'a=3; b=5; a+b*2;' 13
check_result 'a=3; b=a; a=9; b;' 3
check_result 'a=3; a=a+4; a;' 7
check_result 'a=3; b=5; (a+b)*(a+2);' 40
check_result 'a=3; b=5; a=10; a+b*2;' 20
check_result 'z=42; a=7; z-a;' 35
check_result 'a=0-9; b=2; a/b+10;' 6
check_result 'a=255; a+1;' 0
check_result '9-3-2;' 4
check_result '9-(3-2);' 8
check_result '8/2/2;' 2
check_result '8/(2/2);' 8
check_result '2+3*4;' 14
check_result 'a=14;' 14
check_result '1; 2; 3;' 3
check_result $' a = 3;\n b = 5;\t a+b; ' 8
check_error() {
    status=0
    "$check_dir/compiler" "$1" >"$check_dir/output" 2>"$check_dir/error" || status=$?
    test "$status" -eq 1
    test ! -s "$check_dir/output"
    grep -F "$2" "$check_dir/error" >/dev/null
}
check_error 'a;' '代入前の変数'
check_error 'a=a+1;' '代入前の変数'
check_error 'a=3; b=c;' '代入前の変数'
check_error 'a=3' 'セミコロン'
check_error 'a=256;' '整数は０〜２５５'
check_error '' '文が１つ以上'
check_error 'a=;' '数・変数・開き括弧'
check_error 'a=(3+4;' '閉じ括弧'
check_error 'a=b=3;' '代入前の変数'
check_error 'ab=3;' '変数名は小文字１文字'
check_error 'a=1; a+1=2;' 'セミコロン'
check_error "a=1;$(printf '%01025d' 0);" '１０２４バイトまで'
status=0
"$check_dir/compiler" >"$check_dir/output" 2>"$check_dir/error" || status=$?
test "$status" -eq 1
status=0
"$check_dir/compiler" 'a=1;' 'a;' >"$check_dir/output" 2>"$check_dir/error" || status=$?
test "$status" -eq 1
"$check_dir/compiler" 'a=3; z=5; a+z;' >"$check_dir/result.s"
grep -F 'sub rsp, 208' "$check_dir/result.s" >/dev/null
grep -F 'mov [rbp - 8], rax' "$check_dir/result.s" >/dev/null
grep -F 'mov [rbp - 208], rax' "$check_dir/result.s" >/dev/null
grep -F 'mov rsp, rbp' "$check_dir/result.s" >/dev/null
"$check_dir/compiler" 'a=3; b=5; a+b*2;' >"$check_dir/original.s"
sed 's/\[rbp - 16\]/[rbp - 8]/g' "$check_dir/original.s" >"$check_dir/alias.s"
gcc -o "$check_dir/alias" "$check_dir/alias.s"
status=0
"$check_dir/alias" || status=$?
test "$status" -eq 15
printf '代入・読み出し・再代入・一時保存・四則演算・未初期化と構文エラーを確認しました。\n'
