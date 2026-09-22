#include <ctype.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef enum { NUMBER, SYMBOL, END } TokenKind;
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
} Parser;

/* 第３章と同じ読み取り規則。今回は表示に使わない長さを省略する。 */
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
        if (strchr("+-*/()", source[pos]) != NULL) {
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

static Node *primary(Parser *p) {
    if (consume(p, '(')) {
        Node *node = expr(p);
        if (node == NULL) return NULL;
        if (!consume(p, ')')) return fail(p, "閉じ括弧が必要です。");
        return node;
    }
    Token token = p->tokens[p->cursor];
    if (token.kind != NUMBER) return fail(p, "数または開き括弧が必要です。");
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

/* 木を「（演算子 左の部分木 右の部分木）」の形で表示する。 */
static void print_tree(const Node *node) {
    if (node->op == '\0') {
        printf("%d", node->value);
        return;
    }
    printf("(%c ", node->op);
    print_tree(node->left);
    printf(" ");
    print_tree(node->right);
    printf(")");
}

int main(int argc, char **argv) {
    if (argc != 2) {
        fprintf(stderr, "使い方：構文解析する式を１つ渡してください。\n");
        return 1;
    }
    size_t length = strlen(argv[1]);
    if (length > 1024) {
        fprintf(stderr, "教材では入力を１０２４バイトまでに制限しています。\n");
        return 1;
    }
    /* ノード数は数と演算子の個数以下なので、入力の長さ分で足りる。 */
    Token *tokens = calloc(length + 1, sizeof(Token));
    Node *nodes = calloc(length + 1, sizeof(Node));
    if (tokens == NULL || nodes == NULL) {
        fprintf(stderr, "メモリを確保できませんでした。\n");
        free(tokens);
        free(nodes);
        return 1;
    }
    int status = 1;
    if (tokenize(argv[1], tokens)) {
        Parser parser = {argv[1], tokens, 0, nodes, 0, false};
        Node *root = expr(&parser);
        if (root != NULL && tokens[parser.cursor].kind != END) {
            root = fail(&parser, "式の後に余分なトークンがあります。");
        }
        if (root != NULL) {
            print_tree(root);
            printf("\n");
            status = 0;
        }
    }
    free(tokens);
    free(nodes);
    return status;
}
