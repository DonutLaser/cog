export enum TokenType {
    Func,
    Identifier,
    LBrace,
    RBrace,
    LParen,
    RParen,
    LBracket,
    RBracket,
    String,
    Number,
    Comma,
    Colon,
    Assign,
    Plus,
    Minus,
    Asterisk,
    ForwardSlash,
    Range,
    Equal,
    NotEqual,
    LessThan,
    LessThanEqual,
    GreaterThan,
    GreaterThanEqual,
    Type,
    Return,
    Let,
    True,
    False,
    And,
    Or,
    If,
    ElseIf,
    Else,
    For,
    It,
    In,
    Break,
    Skip,
    Defer,
    EOF,
}

export interface Token {
    type: TokenType;
    value?: string;
}

export class TokenList {
    private tokens: Token[] = [];
    private cursor = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
        this.cursor = -1;
    }

    pop(): Token {
        if (this.cursor >= this.tokens.length) {
            this.cursor = this.tokens.length - 1;
        }

        return this.tokens[++this.cursor];
    }

    peek(pos = 1): Token {
        if (this.cursor >= this.tokens.length) {
            this.cursor = this.tokens.length - 2;
        }

        return this.tokens[this.cursor + pos];
    }

    dump(): void {
        for (const token of this.tokens) {
            console.log(tokenToString(token.type), token.value);
        }
    }
}

export function tokenToString(tokenType: TokenType): string {
    switch (tokenType) {
        case TokenType.Func:
            return 'func';
        case TokenType.Identifier:
            return 'identifier';
        case TokenType.LBrace:
            return 'lbrace';
        case TokenType.RBrace:
            return 'rbrace';
        case TokenType.LParen:
            return 'lparen';
        case TokenType.RParen:
            return 'rparen';
        case TokenType.LBracket:
            return 'lbracket';
        case TokenType.RBracket:
            return 'rbracket';
        case TokenType.String:
            return 'string';
        case TokenType.Number:
            return 'number';
        case TokenType.Comma:
            return 'comma';
        case TokenType.Colon:
            return 'colon';
        case TokenType.Assign:
            return 'assign';
        case TokenType.Plus:
            return 'plus';
        case TokenType.Minus:
            return 'minus';
        case TokenType.Asterisk:
            return 'asterisk';
        case TokenType.ForwardSlash:
            return 'forward_slash';
        case TokenType.Range:
            return 'range';
        case TokenType.Equal:
            return 'equal';
        case TokenType.NotEqual:
            return 'not_equal';
        case TokenType.LessThan:
            return 'less_than';
        case TokenType.LessThanEqual:
            return 'less_than_or_equal';
        case TokenType.GreaterThan:
            return 'greater_than';
        case TokenType.GreaterThanEqual:
            return 'greater_than_or_equal';
        case TokenType.Type:
            return 'type';
        case TokenType.Return:
            return 'return';
        case TokenType.Let:
            return 'let';
        case TokenType.True:
            return 'true';
        case TokenType.False:
            return 'false';
        case TokenType.And:
            return 'and';
        case TokenType.Or:
            return 'or';
        case TokenType.EOF:
            return 'eof';
        case TokenType.If:
            return 'if';
        case TokenType.ElseIf:
            return 'else if';
        case TokenType.Else:
            return 'else';
        case TokenType.For:
            return 'for';
        case TokenType.It:
            return 'it';
        case TokenType.In:
            return 'in';
        case TokenType.Break:
            return 'break;';
        case TokenType.Skip:
            return 'skip';
        case TokenType.Defer:
            return 'defer';
        default:
            return 'unknown';
    }
}

export function lex(src: string): TokenList {
    const result: Token[] = [];
    const chars = src.split('');

    for (let i = 0; i < chars.length; ++i) {
        i = skipWhitespace(chars, i);

        if (chars[i] === '(') {
            result.push({ type: TokenType.LParen });
        } else if (chars[i] === ')') {
            result.push({ type: TokenType.RParen });
        } else if (chars[i] === '{') {
            result.push({ type: TokenType.LBrace });
        } else if (chars[i] === '}') {
            result.push({ type: TokenType.RBrace });
        } else if (chars[i] === '[') {
            result.push({ type: TokenType.LBracket });
        } else if (chars[i] === ']') {
            result.push({ type: TokenType.RBracket });
        } else if (isDigit(chars[i])) {
            // Number
            const start = i;
            while (i < chars.length && isDigit(chars[i])) {
                ++i;
            }

            const value = chars.slice(start, i).join('');
            result.push({ type: TokenType.Number, value });

            --i; // We might be on the next character we want to read, but the loop will increment the index and skip that character, so we decrement the index by hand
        } else if (isCharacter(chars[i])) {
            // Identifier or intrinsic function name
            const start = i;
            while (i < chars.length && isCharacter(chars[i])) {
                ++i;
            }

            const value = chars.slice(start, i).join('');
            if (value === 'func') {
                result.push({ type: TokenType.Func });
            } else if (value === 'string') {
                result.push({ type: TokenType.Type, value });
            } else if (value === 'i32') {
                result.push({ type: TokenType.Type, value });
            } else if (value === 'bool') {
                result.push({ type: TokenType.Type, value });
            } else if (value === 'void') {
                result.push({ type: TokenType.Type, value });
            } else if (value === 'return') {
                result.push({ type: TokenType.Return });
            } else if (value === 'let') {
                result.push({ type: TokenType.Let });
            } else if (value === 'true') {
                result.push({ type: TokenType.True });
            } else if (value === 'false') {
                result.push({ type: TokenType.False });
            } else if (value === 'and') {
                result.push({ type: TokenType.And });
            } else if (value === 'or') {
                result.push({ type: TokenType.Or });
            } else if (value === 'if') {
                result.push({ type: TokenType.If });
            } else if (value === 'elif') {
                result.push({ type: TokenType.ElseIf });
            } else if (value === 'else') {
                result.push({ type: TokenType.Else });
            } else if (value === 'for') {
                result.push({ type: TokenType.For });
            } else if (value === 'it') {
                result.push({ type: TokenType.It });
            } else if (value === 'in') {
                result.push({ type: TokenType.In });
            } else if (value === 'break') {
                result.push({ type: TokenType.Break });
            } else if (value === 'skip') {
                result.push({ type: TokenType.Skip });
            } else if (value === 'defer') {
                result.push({ type: TokenType.Defer });
            } else {
                result.push({ type: TokenType.Identifier, value });
            }

            --i; // We are now on the next character we want to read, but the loop will increment it again, so we decrement it here
        } else if (chars[i] === '\'') {
            // String
            ++i; // Ignore the first quote

            const start = i;
            while (i < chars.length && chars[i] !== '\'') {
                ++i;
            }

            const value = chars.slice(start, i).join('');
            result.push({ type: TokenType.String, value });
        } else if (chars[i] === ',') {
            result.push({ type: TokenType.Comma });
        } else if (chars[i] === ':') {
            result.push({ type: TokenType.Colon });
        } else if (chars[i] === '=') {
            if (chars[i + 1] === '=') {
                ++i;
                result.push({ type: TokenType.Equal });
            } else {
                result.push({ type: TokenType.Assign });
            }
        } else if (chars[i] === '!') {
            if (chars[i + 1] === '=') {
                ++i;
                result.push({ type: TokenType.NotEqual });
            }
        } else if (chars[i] === '<') {
            if (chars[i + 1] === '=') {
                ++i;
                result.push({ type: TokenType.LessThanEqual });
            } else {
                result.push({ type: TokenType.LessThan });
            }
        } else if (chars[i] === '>') {
            if (chars[i + 1] === '=') {
                ++i;
                result.push({ type: TokenType.GreaterThanEqual });
            } else {
                result.push({ type: TokenType.GreaterThan });
            }
        } else if (chars[i] === '+') {
            result.push({ type: TokenType.Plus });
        } else if (chars[i] === '-') {
            result.push({ type: TokenType.Minus });
        } else if (chars[i] === '*') {
            result.push({ type: TokenType.Asterisk });
        } else if (chars[i] === '/') {
            result.push({ type: TokenType.ForwardSlash });
        } else if (chars[i] === '.') {
            if (chars[i + 1] === '.') {
                ++i;
                result.push({ type: TokenType.Range });
            }
        }
        else if (chars[i] === '#') {
            // Skipping anything on this line, it's a comment
            while (i < chars.length && chars[i] !== '\n') {
                ++i;
            }
        }
    }

    result.push({ type: TokenType.EOF });

    return new TokenList(result);
}

function isWhitespace(ch: string): boolean {
    return ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t';
}

function isCharacter(ch: string): boolean {
    return ch >= 'a' && ch <= 'z' || ch >= 'A' && ch <= 'Z' || ch >= '0' && ch <= '9' || ch === '_';
}

function isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
}

function skipWhitespace(chars: string[], i: number): number {
    while (i < chars.length && isWhitespace(chars[i])) {
        i++;
    }

    return i;
}
