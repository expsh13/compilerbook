#include <stdio.h>

static int twice(int x) { return x * 2; }
static int *identity(int *p) { return p; }
typedef int (*Operation)(int);

int main(void) {
    int values[3] = {10, 20, 30};
    int *a[3] = {&values[0], &values[1], &values[2]};
    int (*p)[3] = &values;
    int (*fp)(int) = twice;
    Operation op = twice;
    int *result = identity(&values[1]);
    printf("配列の要素=%d、配列へのポインタ経由=%d\n", *a[1], (*p)[1]);
    printf("配列=%zu、ポインタ=%zu、指す配列=%zu\n",
           sizeof a, sizeof p, sizeof *p);
    printf("関数ポインタ=%d、別名経由=%d、返った先=%d\n",
           fp(7), op(7), *result);
    return 0;
}
