.intel_syntax noprefix
.text
.globl main
main:
    mov rax, 7
    add rax, 5
    sub rax, 3
    ret
.section .note.GNU-stack,"",@progbits
