#include <stdio.h>
static void change(int a[3]) {
    a[1] = 99;
    printf("関数内のポインタ=%zu\n", sizeof(int *));
}
static void row(int (*p)[3]) {
    (*p)[2] = 77;
}
int main(void) {
    int a[3] = {10, 20, 30};
    printf("呼び出し元の配列=%zu\n", sizeof a);
    change(a);
    row(&a);
    printf("変更後=%d,%d,%d\n", a[0], a[1], a[2]);
    return 0;
}
