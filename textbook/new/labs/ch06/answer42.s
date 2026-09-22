.intel_syntax noprefix
.text
.globl answer
.type answer, @function
answer:
    mov rax, 42
    ret
.size answer, .-answer
.section .note.GNU-stack,"",@progbits
