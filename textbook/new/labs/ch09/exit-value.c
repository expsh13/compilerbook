#include <stdio.h>

#ifndef RESULT
#define RESULT 300
#endif

int main(void) {
    printf("main が返す値=%d\n", RESULT);
    return RESULT;
}
