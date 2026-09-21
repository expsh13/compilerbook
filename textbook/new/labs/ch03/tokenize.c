#include <ctype.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef enum { NUMBER, SYMBOL, END } TokenKind;

typedef struct {
    TokenKind kind;
    size_t start;
    size_t length;
    int value;
} Token;

static bool tokenize(const char *source, Token *tokens, size_t *count) {
    size_t pos = 0;
    *count = 0;
    while (source[pos] != '\0') {
        if (isspace((unsigned char)source[pos])) {
            pos++;
            continue;
        }
        size_t start = pos;
        if (source[pos] >= '0' && source[pos] <= '9') {
            int value = 0;
            while (source[pos] >= '0' && source[pos] <= '9') {
                value = value * 10 + (source[pos] - '0');
                if (value > 255) {
                    fprintf(stderr, "位置%zu：整数は０〜２５５で入力してください。\n", start);
                    return false;
                }
                pos++;
            }
            tokens[(*count)++] = (Token){NUMBER, start, pos - start, value};
            continue;
        }
        if (strchr("+-*/()", source[pos]) != NULL) {
            tokens[(*count)++] = (Token){SYMBOL, start, 1, 0};
            pos++;
            continue;
        }
        fprintf(stderr, "位置%zu：扱えない文字です。\n", pos);
        return false;
    }
    tokens[(*count)++] = (Token){END, pos, 0, 0};
    return true;
}

int main(int argc, char **argv) {
    if (argc != 2) {
        fprintf(stderr, "使い方：字句解析する文字列を１つ渡してください。\n");
        return 1;
    }
    const char *source = argv[1];
    /* １文字１トークンの場合と、末尾の終了トークンを収める。 */
    Token *tokens = calloc(strlen(source) + 1, sizeof(Token));
    if (tokens == NULL) {
        fprintf(stderr, "トークンを保存するメモリを確保できませんでした。\n");
        return 1;
    }
    size_t count;
    if (!tokenize(source, tokens, &count)) {
        free(tokens);
        return 1;
    }
    for (size_t i = 0; i < count; i++) {
        Token token = tokens[i];
        if (token.kind == NUMBER) {
            printf("数 値=%d 位置=%zu 長さ=%zu\n", token.value, token.start, token.length);
        } else if (token.kind == SYMBOL) {
            printf("記号 '%c' 位置=%zu 長さ=%zu\n", source[token.start], token.start, token.length);
        } else {
            printf("終了 位置=%zu 長さ=0\n", token.start);
        }
    }
    free(tokens);
    return 0;
}
