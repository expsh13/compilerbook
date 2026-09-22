.intel_syntax noprefix
.text
.globl sign_extend
.type sign_extend, @function
sign_extend:
    movsx rax, dil
    ret
.size sign_extend, .-sign_extend

.globl zero_extend
.type zero_extend, @function
zero_extend:
    movzx eax, dil
    ret
.size zero_extend, .-zero_extend

.globl write_eax
.type write_eax, @function
write_eax:
    mov rax, -1
    mov eax, 1
    ret
.size write_eax, .-write_eax

# 戻り値の下位８ビットは結果、ビット８はＣＦ、ビット９はＯＦ。
.globl add_one_byte
.type add_one_byte, @function
add_one_byte:
    mov eax, edi
    xor edx, edx
    xor ecx, ecx
    add al, 1
    setc dl
    seto cl
    movzx eax, al
    shl edx, 8
    shl ecx, 9
    or eax, edx
    or eax, ecx
    ret
.size add_one_byte, .-add_one_byte
.section .note.GNU-stack,"",@progbits
