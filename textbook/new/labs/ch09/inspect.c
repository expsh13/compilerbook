#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

int64_t sign_extend(uint64_t value);
uint64_t zero_extend(uint64_t value);
uint64_t write_eax(void);
uint32_t add_one_byte(uint32_t value);

static void show_byte(unsigned value) {
    for (int bit = 7; bit >= 0; bit--) putchar((value >> bit) & 1 ? '1' : '0');
    /* 範囲外の符号付き型への変換に頼らず、２の補数の解釈を計算する。 */
    int signed_value = value < 128 ? (int)value : (int)value - 256;
    printf("：符号なし=%u、符号あり=%d\n", value, signed_value);
}

static void show_add(unsigned value) {
    uint32_t packed = add_one_byte(value);
    printf("８ビット加算 %u+1：結果=%" PRIu32 "、ＣＦ=%" PRIu32 "、ＯＦ=%" PRIu32 "\n",
           value, packed & 255, (packed >> 8) & 1, (packed >> 9) & 1);
}

int main(int argc, char **argv) {
    if (argc != 2 ||
        (strcmp(argv[1], "all") && strcmp(argv[1], "bits") &&
         strcmp(argv[1], "extend") && strcmp(argv[1], "register") &&
         strcmp(argv[1], "convert") && strcmp(argv[1], "add"))) {
        fprintf(stderr, "使い方：bits・extend・register・convert・add・all のいずれかを指定してください。\n");
        return 1;
    }
    int all = strcmp(argv[1], "all") == 0;
    if (all || strcmp(argv[1], "bits") == 0) {
        show_byte(127);
        show_byte(128);
        show_byte(254);
        show_byte(255);
    }
    if (all || strcmp(argv[1], "extend") == 0) {
        uint64_t zero = zero_extend(255);
        int64_t sign = sign_extend(255);
        printf("ゼロ拡張：値=%" PRIu64 "、１６進=%016" PRIx64 "\n", zero, zero);
        printf("符号拡張：値=%" PRId64 "、１６進=%016" PRIx64 "\n", sign, (uint64_t)sign);
    }
    if (all || strcmp(argv[1], "register") == 0) {
        printf("eax に１を書いた後の rax=%" PRIu64 "\n", write_eax());
    }
    if (all || strcmp(argv[1], "convert") == 0) {
        uint8_t a = 255;
        int sum = a + 1;
        uint8_t narrowed = (uint8_t)sum;
        printf("Ｃの a+1=%d、８ビット符号なしへ変換後=%u\n", sum, (unsigned)narrowed);
    }
    if (all || strcmp(argv[1], "add") == 0) {
        show_add(255);
        show_add(127);
    }
    return 0;
}
