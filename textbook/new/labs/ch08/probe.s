.intel_syntax noprefix
.text
# 引数と結果は通常版と同じ。呼び出し位置とレジスタ保存を厳しく調べる。
.globl f
f:
    mov r11, rsp
    and r11, 15
    cmp r11, 8
    jne .Lbad
    imul rax, rdi, 10
    add rax, rsi
    jmp .Lclobber
.globl g
g:
    mov r11, rsp
    and r11, 15
    cmp r11, 8
    jne .Lbad
    imul rax, rdi, 2
    jmp .Lclobber
.globl h
h:
    mov r11, rsp
    and r11, 15
    cmp r11, 8
    jne .Lbad
    mov rax, 7
.Lclobber:
    mov rdi, 101
    mov rsi, 102
    mov rdx, 103
    mov rcx, 104
    mov r8, 105
    mov r9, 106
    mov r10, 107
    mov r11, 108
    ret
.Lbad:
    # 不正な呼び出し位置を必ずテスト失敗として検出する。
    ud2
.section .note.GNU-stack,"",@progbits
