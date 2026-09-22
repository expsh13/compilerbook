#if defined(ARRAY_OF_FUNCTIONS)
int f[3](void);
#elif defined(RETURN_ARRAY)
int f(void)[3];
#elif defined(POINTER_TYPE)
void test(void) {
    int a[3];
    int **p = &a;
    (void)p;
}
#elif defined(CONST_VALUE)
void test(void) {
    int n = 7;
    const int *p = &n;
    *p = 9;
}
#elif defined(CONST_POINTER)
void test(void) {
    int n = 7;
    int m = 9;
    int *const p = &n;
    p = &m;
    (void)p;
}
#else
#error 検証する条件を指定してください
#endif
