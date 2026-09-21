#include <stdio.h>

int main(int argc, char **argv) {
    if (argc != 2) {
        fprintf(stderr, "使い方：コンパイラに０〜２５５の整数を１つ渡してください。\n");
        return 1;
    }

    const char *source = argv[1];
    if (source[0] == '\0') {
        fprintf(stderr, "入力が空です。\n");
        return 1;
    }

    int value = 0;
    for (int i = 0; source[i] != '\0'; i++) {
        if (source[i] < '0' || source[i] > '9') {
            fprintf(stderr, "半角数字だけを入力してください。\n");
            return 1;
        }
        value = value * 10 + (source[i] - '0');
        if (value > 255) {
            fprintf(stderr, "整数は０〜２５５の範囲で入力してください。\n");
            return 1;
        }
    }

    printf(".intel_syntax noprefix\n");
    printf(".text\n");
    printf(".globl main\n");
    printf("main:\n");
    printf("    mov rax, %d\n", value);
    printf("    ret\n");
    printf(".section .note.GNU-stack,\"\",@progbits\n");
    return 0;
}
