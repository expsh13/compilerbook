#include <ctype.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef enum { NUMBER, IDENT, SYMBOL, END } TokenKind;
typedef struct {
    TokenKind kind;
    size_t start;
    int value;
} Token;

typedef struct Node Node;
struct Node {
    char op;
    int value;
    Node *left;
    Node *right;
};

typedef struct {
    const char *source;
    Token *tokens;
    size_t cursor;
    Node *nodes;
    size_t used;
    bool failed;
    bool assigned[26];
} Parser;

/* 数に加え、小文字１文字の名前と代入・文末の記号を読む。 */
static bool tokenize(const char *source, Token *tokens) {
    size_t pos = 0, count = 0;
    while (source[pos] != '\0') {
        if (isspace((unsigned char)source[pos])) {
            pos++;
            continue;
        }
        size_t start = pos;
        if (source[pos] >= '0' && source[pos] <= '9') {
            int value = 0;
            while (source[pos] >= '0' && source[pos] <= '9') {
                value = value * 10 + (source[pos] - '0');
                if (value > 255) {
                    fprintf(stderr, "位置%zu：整数は０〜２５５で入力してください。\n", start);
                    return false;
                }
                pos++;
            }
            tokens[count++] = (Token){NUMBER, start, value};
            continue;
        }
        if (source[pos] >= 'a' && source[pos] <= 'z') {
            if (isalnum((unsigned char)source[pos + 1]) || source[pos + 1] == '_') {
                fprintf(stderr, "位置%zu：変数名は小文字１文字にしてください。\n", pos);
                return false;
            }
            tokens[count++] = (Token){IDENT, pos++, 0};
            continue;
        }
        if (strchr("+-*/()=;,", source[pos]) != NULL) {
            tokens[count++] = (Token){SYMBOL, pos++, 0};
            continue;
        }
        fprintf(stderr, "位置%zu：扱えない文字です。\n", pos);
        return false;
    }
    tokens[count] = (Token){END, pos, 0};
    return true;
}

static Node *fail(Parser *p, const char *message) {
    if (!p->failed) {
        fprintf(stderr, "位置%zu：%s\n", p->tokens[p->cursor].start, message);
    }
    p->failed = true;
    return NULL;
}

static bool consume(Parser *p, char symbol) {
    Token token = p->tokens[p->cursor];
    if (token.kind != SYMBOL || p->source[token.start] != symbol) {
        return false;
    }
    p->cursor++;
    return true;
}

static Node *new_node(Parser *p, char op, int value, Node *left, Node *right) {
    Node *node = &p->nodes[p->used++];
    *node = (Node){op, value, left, right};
    return node;
}

static Node *expr(Parser *p);

/* 教材で呼べる関数の名前と引数の個数。 */
static int arity(char name) {
    if (name == 'f') return 2;
    if (name == 'g') return 1;
    if (name == 'h') return 0;
    return -1;
}

static Node *primary(Parser *p) {
    if (consume(p, '(')) {
        Node *node = expr(p);
        if (node == NULL) return NULL;
        if (!consume(p, ')')) return fail(p, "閉じ括弧が必要です。");
        return node;
    }
    Token token = p->tokens[p->cursor];
    if (token.kind == IDENT) {
        char name = p->source[token.start];
        if (p->tokens[p->cursor + 1].kind == SYMBOL &&
            p->source[p->tokens[p->cursor + 1].start] == '(') {
            int count = arity(name);
            if (count < 0) return fail(p, "呼べる関数は f・g・h です。");
            p->cursor += 2;
            Node *first = NULL, *second = NULL;
            if (count >= 1) {
                first = expr(p);
                if (first == NULL) return NULL;
            }
            if (count == 2) {
                if (!consume(p, ',')) return fail(p, "２つの引数をコンマで区切ってください。");
                second = expr(p);
                if (second == NULL) return NULL;
            }
            if (!consume(p, ')')) return fail(p, "引数の個数または閉じ括弧を確認してください。");
            return new_node(p, 'c', name, first, second);
        }
        if (arity(name) >= 0) return fail(p, "関数名には呼び出しの括弧が必要です。");
        int index = name - 'a';
        if (!p->assigned[index]) return fail(p, "代入前の変数は読めません。");
        p->cursor++;
        return new_node(p, 'v', (index + 1) * 8, NULL, NULL);
    }
    if (token.kind != NUMBER) return fail(p, "数・変数・開き括弧が必要です。");
    p->cursor++;
    return new_node(p, '\0', token.value, NULL, NULL);
}

static Node *mul(Parser *p) {
    Node *node = primary(p);
    if (node == NULL) return NULL;
    for (;;) {
        char op;
        if (consume(p, '*')) op = '*';
        else if (consume(p, '/')) op = '/';
        else return node;
        Node *right = primary(p);
        if (right == NULL) return NULL;
        node = new_node(p, op, 0, node, right);
    }
}

static Node *expr(Parser *p) {
    Node *node = mul(p);
    if (node == NULL) return NULL;
    for (;;) {
        char op;
        if (consume(p, '+')) op = '+';
        else if (consume(p, '-')) op = '-';
        else return node;
        Node *right = mul(p);
        if (right == NULL) return NULL;
        node = new_node(p, op, 0, node, right);
    }
}

/* 代入は文としてだけ扱う。右辺を調べた後で代入済みにする。 */
static Node *statement(Parser *p) {
    Token first = p->tokens[p->cursor];
    if (first.kind == IDENT &&
        p->tokens[p->cursor + 1].kind == SYMBOL &&
        p->source[p->tokens[p->cursor + 1].start] == '=') {
        char name = p->source[first.start];
        if (arity(name) >= 0) return fail(p, "f・g・h は関数用の名前です。");
        int index = name - 'a';
        p->cursor += 2;
        Node *right = expr(p);
        if (right == NULL) return NULL;
        if (!consume(p, ';')) return fail(p, "文末にセミコロンが必要です。");
        p->assigned[index] = true;
        return new_node(p, '=', (index + 1) * 8, NULL, right);
    }
    Node *node = expr(p);
    if (node == NULL) return NULL;
    if (!consume(p, ';')) return fail(p, "文末にセミコロンが必要です。");
    return node;
}

/* この部分木の結果を rax に残し、追加したスタック領域は元に戻す。 */
static void generate(const Node *node, int depth) {
    if (node->op == '\0') {
        printf("    mov rax, %d\n", node->value);
        return;
    }
    if (node->op == 'v') {
        printf("    mov rax, [rbp - %d]\n", node->value);
        return;
    }
    if (node->op == '=') {
        generate(node->right, depth);
        printf("    mov [rbp - %d], rax\n", node->value);
        return;
    }
    if (node->op == 'c') {
        int count = arity((char)node->value);
        if (count >= 1) {
            generate(node->left, depth);
            printf("    push rax\n");
        }
        if (count == 2) {
            generate(node->right, depth + 1);
            printf("    push rax\n");
            printf("    pop rsi\n");
        }
        if (count >= 1) printf("    pop rdi\n");
        /* 引数を取り出した後も、外側の式の保存値は残っている。 */
        if (depth % 2 != 0) printf("    sub rsp, 8\n");
        printf("    call %c\n", node->value);
        if (depth % 2 != 0) printf("    add rsp, 8\n");
        return;
    }
    generate(node->left, depth);
    printf("    push rax\n");
    generate(node->right, depth + 1);
    printf("    mov rdi, rax\n");
    printf("    pop rax\n");
    switch (node->op) {
        case '+': printf("    add rax, rdi\n"); break;
        case '-': printf("    sub rax, rdi\n"); break;
        case '*': printf("    imul rax, rdi\n"); break;
        case '/':
            printf("    cqo\n");
            printf("    idiv rdi\n");
            break;
    }
}

int main(int argc, char **argv) {
    if (argc != 2) {
        fprintf(stderr, "使い方：コンパイルする文の列を１つ渡してください。\n");
        return 1;
    }
    size_t length = strlen(argv[1]);
    if (length > 1024) {
        fprintf(stderr, "教材では入力を１０２４バイトまでに制限しています。\n");
        return 1;
    }
    /* 数・変数・演算・代入のノード数は、入力の文字数以下に収まる。 */
    Token *tokens = calloc(length + 1, sizeof(Token));
    Node *nodes = calloc(length + 1, sizeof(Node));
    Node **statements = calloc(length + 1, sizeof(Node *));
    if (tokens == NULL || nodes == NULL || statements == NULL) {
        fprintf(stderr, "メモリを確保できませんでした。\n");
        free(tokens);
        free(nodes);
        free(statements);
        return 1;
    }
    int status = 1;
    if (tokenize(argv[1], tokens)) {
        Parser parser = {.source = argv[1], .tokens = tokens, .nodes = nodes};
        size_t count = 0;
        if (tokens[0].kind == END) fail(&parser, "文が１つ以上必要です。");
        while (!parser.failed && tokens[parser.cursor].kind != END) {
            Node *node = statement(&parser);
            if (node == NULL) break;
            statements[count++] = node;
        }
        if (!parser.failed) {
            printf(".intel_syntax noprefix\n.text\n.globl main\nmain:\n");
            printf("    push rbp\n    mov rbp, rsp\n    sub rsp, 208\n");
            for (size_t i = 0; i < count; i++) generate(statements[i], 0);
            printf("    mov rsp, rbp\n    pop rbp\n    ret\n");
            printf(".section .note.GNU-stack,\"\",@progbits\n");
            status = 0;
        }
    }
    free(tokens);
    free(nodes);
    free(statements);
    return status;
}
