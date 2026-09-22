.intel_syntax noprefix
.text
.globl read_value
.type read_value, @function
read_value:
    mov rax, [rdi]
    ret
.size read_value, .-read_value
.globl write_value
.type write_value, @function
write_value:
    mov [rdi], rsi
    ret
.size write_value, .-write_value
.globl read_next
.type read_next, @function
read_next:
    mov rax, [rdi + 8]
    ret
.size read_next, .-read_next
.globl first_byte
.type first_byte, @function
first_byte:
    movzx eax, BYTE PTR [rdi]
    ret
.size first_byte, .-first_byte
.globl message_address
.type message_address, @function
message_address:
    lea rax, [rip + .Lmessage]
    ret
.size message_address, .-message_address
.section .rodata
.Lmessage:
    .asciz "ABC"
.section .note.GNU-stack,"",@progbits
