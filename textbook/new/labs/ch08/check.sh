#!/usr/bin/env bash
set -eu
cd "$(dirname "$0")"
check_dir=$(mktemp -d /tmp/compilerbook-ch08.XXXXXX)
gcc -std=c11 -Wall -Wextra -Werror -o "$check_dir/compiler" compiler.c
gcc -std=c11 -Wall -Wextra -Werror -O2 -c functions.c -o "$check_dir/functions.o"
gcc -std=c11 -Wall -Wextra -Werror -O0 -c functions.c -o "$check_dir/functions0.o"
gcc -c probe.s -o "$check_dir/probe.o"
check_result() {
    "$check_dir/compiler" "$1" >"$check_dir/result.s"
    for helper in functions functions0 probe; do
        gcc -o "$check_dir/program" "$check_dir/result.s" "$check_dir/$helper.o"
        status=0
        "$check_dir/program" || status=$?
        if [ "$status" -ne "$2" ]; then
            printf '結果が一致しません：%s（%s、期待 %s、実際 %s）\n' "$1" "$helper" "$2" "$status" >&2
            exit 1
        fi
    done
}
check_result 'f(3,5);' 35
check_result 'f(5,3);' 53
check_result 'g(6);' 12
check_result 'h();' 7
check_result '1+h();' 8
check_result 'f(g(3),h());' 67
check_result 'f(3,g(4));' 38
check_result 'f(h(),g(h()));' 84
check_result '1+f(2,g(3));' 27
check_result 'f(f(1,2),f(3,4));' 154
check_result 'a=3; b=f(a,5); a+b;' 38
check_result 'a=3; a=g(a); a;' 6
check_result 'a=9; g(3); a;' 9
check_result '(2+g(3))*(h()+1);' 64
check_result 'f(0-2,5)+20;' 5
check_result 'g(0-3)+10;' 4
check_result '8/g(2);' 2
check_result '9-(3-2);' 8
check_result 'a=3; b=5; a+b*2;' 13
check_result 'g(1); g(2); h();' 7
check_error() {
    status=0
    "$check_dir/compiler" "$1" >"$check_dir/output" 2>"$check_dir/error" || status=$?
    test "$status" -eq 1
    test ! -s "$check_dir/output"
    test -s "$check_dir/error"
}
for input in 'f(1);' 'f();' 'f(1,2,3);' 'g();' 'g(1,2);' 'h(1);' 'q();' 'f=3;' 'f;' 'f(a,2);' 'f(1,2)' 'g(1;' 'a=a+1;' 'abc(1);' ''; do
    check_error "$input"
done
"$check_dir/compiler" 'f(3,5);' >"$check_dir/result.s"
status=0
gcc "$check_dir/result.s" -o "$check_dir/missing" 2>"$check_dir/link-error" || status=$?
test "$status" -ne 0
test -s "$check_dir/link-error"
printf '引数の順序・入れ子・変数・スタックの整列・レジスタの上書き耐性・入力エラーを確認しました。\n'
