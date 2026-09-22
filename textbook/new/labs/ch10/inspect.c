#include <assert.h>
#include <inttypes.h>
#include <limits.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

_Static_assert(CHAR_BIT == 8 && sizeof(int64_t) == 8, "８ビットのバイトと８バイトの整数が必要です");

int64_t read_value(const int64_t *p);
void write_value(int64_t *p, int64_t value);
int64_t read_next(const int64_t *p);
unsigned first_byte(const char *p);
const char *message_address(void);

static void address(void) {
    int64_t a = 7;
    int64_t *p = &a;
    int64_t *q = p;
    printf("a の場所=%p、p が指す場所=%p\n", (void *)&a, (void *)p);
    printf("p 自身の場所=%p\n", (void *)&p);
    printf("読み出し前：a=%" PRId64 "、*p=%" PRId64 "\n", a, *p);
    printf("機械語で読み出す値=%" PRId64 "\n", read_value(p));
    write_value(q, 42);
    printf("書き込み後：a=%" PRId64 "、*p=%" PRId64 "、*q=%" PRId64 "\n", a, *p, *q);
    assert(a == 42 && p == q && p == &a);
}

static void array(void) {
    int64_t values[] = {10, 20, 30};
    int64_t *p = values;
    printf("１要素の幅=%zu、配列全体=%zu\n", sizeof *p, sizeof values);
    printf("p[1]=%" PRId64 "、*(p+1)=%" PRId64 "、機械語=%" PRId64 "\n",
           p[1], *(p + 1), read_next(p));
    printf("p+1 と p の差=%td 要素\n", (p + 1) - p);
    assert(read_next(p) == 20);
}

static void string(void) {
    char text[] = "ABC";
    printf("変更前：文字列=%s、配列の大きさ=%zu、文字列の長さ=%zu\n",
           text, sizeof text, strlen(text));
    printf("４バイト=%u,%u,%u,%u\n", (unsigned char)text[0],
           (unsigned char)text[1], (unsigned char)text[2], (unsigned char)text[3]);
    text[1] = '\0';
    printf("変更後：文字列=%s、配列の大きさ=%zu、文字列の長さ=%zu\n",
           text, sizeof text, strlen(text));
    printf("残っている text[2]=%c\n", text[2]);
    assert(sizeof text == 4 && strlen(text) == 1 && text[2] == 'C');
}

static void literal(void) {
    const char *p = message_address();
    printf("返された文字列=%s、最初のバイト=%u\n", p, first_byte(p));
    assert(strcmp(p, "ABC") == 0 && first_byte(p) == 65);
}

int main(int argc, char **argv) {
    if (argc != 2) {
        fprintf(stderr, "使い方：address・array・string・literal・all のいずれかを指定してください。\n");
        return 1;
    }
    if (!strcmp(argv[1], "address")) address();
    else if (!strcmp(argv[1], "array")) array();
    else if (!strcmp(argv[1], "string")) string();
    else if (!strcmp(argv[1], "literal")) literal();
    else if (!strcmp(argv[1], "all")) { address(); array(); string(); literal(); }
    else {
        fprintf(stderr, "指定された実験名はありません。\n");
        return 1;
    }
    return 0;
}
