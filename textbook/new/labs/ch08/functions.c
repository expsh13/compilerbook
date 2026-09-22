/* この教材のリナックス x86-64 環境では long は８バイト。 */
_Static_assert(sizeof(long) == 8, "８バイトの long を持つ環境が必要です");

long f(long x, long y) {
    return x * 10 + y;
}

long g(long x) {
    return x * 2;
}

long h(void) {
    return 7;
}
