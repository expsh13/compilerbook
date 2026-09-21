.intel_syntax noprefix
.text
.globl main
main:
    mov rax, 7
    mov rcx, rax
    add rax, 5
    sub rcx, 3
    mov rax, rcx
    ret
.section .note.GNU-stack,"",@progbits
