#include <assert.h>
#include <stdio.h>

#ifndef RESERVE
#define RESERVE 65536
#endif

const char label[] = "ABC";
int seed = 7;
int zeros;
unsigned char reserve[RESERVE];

static void visit(void) {
    static unsigned count;
    int local = seed + (int)++count;
    printf("関数呼び出し：count=%u、local=%d\n", count, local);
}

int main(void) {
    printf("開始時：seed=%d、zeros=%d、文字列=%s\n", seed, zeros, label);
    for (size_t i = 0; i < sizeof reserve; i++) assert(reserve[i] == 0);
    printf("ゼロ領域=%zu バイト、先頭=%u、末尾=%u\n",
           sizeof reserve, (unsigned)reserve[0], (unsigned)reserve[sizeof reserve - 1]);
    visit();
    visit();
    seed = 42;
    zeros = 9;
    reserve[sizeof reserve - 1] = 1;
    printf("変更後：seed=%d、zeros=%d、末尾=%u\n",
           seed, zeros, (unsigned)reserve[sizeof reserve - 1]);
    return 0;
}
