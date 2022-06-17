import { TokenList, tokenToString, TokenType } from './lexer';

export type StringType = string;

export enum DataType {
    Void,
    String,
    I32,
    Bool,
}

export enum Operator {
    Add,
    Subtract,
    Multiply,
    Divide,
    Equal,
    NotEqual,
    LessThan,
    LessThanOrEqual,
    GreaterThan,
    GreaterThanOrEqual,
    And,
    Or,
    Range,
}

export interface Arr {
    type: DataType;
    items: Expression[];
}

export interface FunctionCall {
    name: string;
    arguments: Expression[];
}

export interface IfStatement {
    if: { condition: Expression, block: Block };
    elseif: { condition: Expression, block: Block }[];
    else?: { block: Block };
}

export interface MatchStatement {
    pattern: Expression;
    cases: MatchCase[];
    else?: Block;
}

export interface MatchCase {
    pattern: Expression;
    block: Block;
}

export interface ForStatement {
    item?: string;
    expression?: Expression;
    block: Block;
}

export interface BinaryOp {
    op: Expression;
    left: Expression;
    right: Expression;
}

export type Variable = StringType;

export type ExpressionType = 'function-call' | 'string' | 'i32' | 'bool' | 'array' | 'variable' | 'operator' | 'binary-operation';
export interface Expression {
    type: ExpressionType;
    data: any;
}

export interface VariableDecl {
    name: string;
    type: DataType;
    isArray: boolean;
    value: Expression;
}

export type StatementType = 'expression' | 'return' | 'variable-decl' | 'if-statement' | 'match-statement' | 'for-statement' | 'break' | 'skip' | 'defer';
export interface Statement {
    type: StatementType;
    data: any;
}

export interface Block {
    statements: Statement[];
    variables: VariableDecl[];
}

export interface Parameter {
    name: string;
    type: DataType;
}

export interface Func {
    name: string;
    params: Parameter[];
    block: Block;
    returns: DataType;
}

export interface ParsedFile {
    funcs: Func[];
}

export function parse(tokenList: TokenList): ParsedFile {
    const result: ParsedFile = { funcs: [] };

    let token = tokenList.pop();
    while (token.type !== TokenType.EOF) {
        switch (token.type) {
            case TokenType.Func:
                result.funcs.push(parseFunction(tokenList));
                break;
        }

        token = tokenList.pop();
    }

    return result;
}

const OPERATOR_PRECEDENCE: { [op: number]: number } = {
    [Operator.Add]: 100,
    [Operator.Subtract]: 100,
    [Operator.Multiply]: 120,
    [Operator.Divide]: 120,
    [Operator.Range]: 70,
    [Operator.Equal]: 50,
    [Operator.NotEqual]: 50,
    [Operator.LessThan]: 50,
    [Operator.LessThanOrEqual]: 50,
    [Operator.GreaterThan]: 50,
    [Operator.GreaterThanOrEqual]: 50,
    [Operator.And]: 25,
    [Operator.Or]: 25,
};

function parseFunction(tokenList: TokenList): Func {
    const result: Func = { name: '', returns: DataType.Void, params: [], block: { statements: [], variables: [] } };

    let token = tokenList.pop();
    if (token.type === TokenType.EOF) {
        throw new Error('Unexpected end of file');
    }

    if (token.type === TokenType.Identifier) {
        result.name = token.value as string;

        token = tokenList.pop();
        if (token.type !== TokenType.LParen) {
            throw new Error(`Expected '(', got '${tokenToString(token.type)}'`);
        }

        token = tokenList.peek();
        if (token.type === TokenType.RParen) {
            token = tokenList.pop();
        }

        while (token.type !== TokenType.EOF && token.type !== TokenType.RParen) {
            result.params.push(parseFunctionParameter(tokenList));

            token = tokenList.pop();
            if (token.type !== TokenType.Comma) {
                break;
            }

            token = tokenList.peek();
        }

        if (token.type !== TokenType.RParen) {
            throw new Error(`Expected ')', got '${tokenToString(token.type)}'`);
        }

        result.returns = parseType(tokenList);
        result.block = parseBlock(tokenList);
    } else {
        throw new Error(`Expected function name, got '${tokenToString(token.type)}'`);
    }

    return result;
}

function parseBlock(tokenList: TokenList): Block {
    const result: Block = { statements: [], variables: [] };

    let token = tokenList.pop();
    if (token.type !== TokenType.LBrace) {
        throw new Error(`Expected '{', got '${tokenToString(token.type)}'`);
    }

    token = tokenList.peek();
    while (token.type !== TokenType.EOF && token.type !== TokenType.RBrace) {
        const stmnt = parseStatement(tokenList);
        if (stmnt.type === 'variable-decl') {
            result.variables.push(stmnt.data);
        }

        result.statements.push(stmnt);
        token = tokenList.peek();
    }

    if (token.type !== TokenType.RBrace) {
        throw new Error(`Expected '}', got '${tokenToString(token.type)}'`);
    }

    tokenList.pop();

    return result;
}

function parseStatement(tokenList: TokenList): Statement {
    let token = tokenList.peek();
    while (token.type !== TokenType.EOF) {
        switch (token.type) {
            case TokenType.Identifier:
                return { type: 'expression', data: parseExpression(tokenList) };
            case TokenType.Return:
                tokenList.pop();
                return { type: 'return', data: parseExpression(tokenList) };
            case TokenType.Let:
                return { type: 'variable-decl', data: parseVariableDecl(tokenList) };
            case TokenType.If:
                return { type: 'if-statement', data: parseIfStatement(tokenList) };
            case TokenType.Match:
                return { type: 'match-statement', data: parseMatchStatement(tokenList) };
            case TokenType.For:
                return { type: 'for-statement', data: parseForStatement(tokenList) };
            case TokenType.Break:
                tokenList.pop();
                return { type: 'break', data: null };
            case TokenType.Skip:
                tokenList.pop();
                return { type: 'skip', data: null };
            case TokenType.Defer:
                tokenList.pop();
                return { type: 'defer', data: parseExpression(tokenList) };
        }

        token = tokenList.pop();
    }

    throw new Error('Incomplete statement');
}

function parseIfStatement(tokenList: TokenList): IfStatement {
    const result: IfStatement = {
        if: { condition: { type: 'bool', data: null }, block: { statements: [], variables: [] } },
        elseif: [],
    };

    let token = tokenList.pop();
    if (token.type !== TokenType.If) {
        throw new Error(`Expected 'if', got '${tokenToString(token.type)}'`);
    }

    result.if.condition = parseExpression(tokenList);
    result.if.block = parseBlock(tokenList);

    token = tokenList.peek();
    if (token.type === TokenType.ElseIf) { result.elseif = []; }
    while (token.type === TokenType.ElseIf) {
        tokenList.pop();
        result.elseif.push({
            condition: parseExpression(tokenList),
            block: parseBlock(tokenList),
        });

        token = tokenList.peek();
    }

    token = tokenList.peek();
    if (token.type === TokenType.Else) {
        tokenList.pop();
        result.else = { block: parseBlock(tokenList) };
    }

    return result;
}

function parseMatchStatement(tokenList: TokenList): MatchStatement {
    const result: MatchStatement = { pattern: { type: 'string', data: null }, cases: [] };

    let token = tokenList.pop();
    if (token.type !== TokenType.Match) {
        throw new Error(`Expected 'match', got '${tokenToString(token.type)}'`);
    }

    result.pattern = parseExpression(tokenList);

    token = tokenList.pop();
    if (token.type !== TokenType.LBrace) {
        throw new Error(`Expected '{', got '${tokenToString(token.type)}'`);
    }

    while (token.type !== TokenType.EOF && token.type !== TokenType.RBrace && token.type !== TokenType.Else) {
        result.cases.push(parseMatchCase(tokenList));
        token = tokenList.peek();
    }

    token = tokenList.pop();
    if (token.type === TokenType.Else) {
        result.else = parseBlock(tokenList);
    }

    token = tokenList.pop();
    if (token.type !== TokenType.RBrace) {
        throw new Error(`Expected '}', got '${tokenToString(token.type)}'`);
    }

    return result;
}

function parseMatchCase(tokenList: TokenList): MatchCase {
    const result: MatchCase = { pattern: { type: 'string', data: null }, block: { statements: [], variables: [] } };

    result.pattern = parseExpression(tokenList);
    result.block = parseBlock(tokenList);

    return result;
}

function parseForStatement(tokenList: TokenList): ForStatement {
    const result: ForStatement = { block: { statements: [], variables: [] }, };

    let token = tokenList.pop();
    if (token.type !== TokenType.For) {
        throw new Error(`Expected 'for', got '${tokenToString(token.type)}'`);
    }

    token = tokenList.peek();
    if (token.type !== TokenType.LBrace) {
        if (token.type === TokenType.Identifier) {
            const identifier = token.value as string;

            if (tokenList.peek(2).type === TokenType.In) {
                result.item = identifier;
                token = tokenList.pop();
            }
        }

        result.expression = parseExpression(tokenList);
    }

    result.block = parseBlock(tokenList);
    return result;
}

function parseFunctionCall(tokenList: TokenList): FunctionCall {
    const result: FunctionCall = { name: '', arguments: [] };

    let token = tokenList.pop();
    if (token.type !== TokenType.Identifier) {
        throw new Error(`Expected function name, got '${tokenToString(token.type)}'`);
    }

    result.name = token.value as string;

    token = tokenList.pop();
    if (token.type !== TokenType.LParen) {
        throw new Error(`Expected '(', got ${tokenToString(token.type)}`);
    }

    token = tokenList.peek();
    if (token.type === TokenType.RParen) {
        token = tokenList.pop();
    }

    while (token.type !== TokenType.EOF && token.type !== TokenType.RParen) {
        result.arguments.push(parseExpression(tokenList));
        token = tokenList.pop();
    }

    if (token.type !== TokenType.RParen) {
        throw new Error(`Expected ')', got '${tokenToString(token.type)}'`);
    }

    return result;
}

function parseFunctionParameter(tokenList: TokenList): Parameter {
    const result: Parameter = { name: '', type: DataType.String };

    const token = tokenList.pop();
    if (token.type === TokenType.Identifier) {
        result.name = token.value as string;
    } else {
        throw new Error(`Expected parameter name, got '${tokenToString(token.type)}'`);
    }

    result.type = parseType(tokenList);

    return result;
}

function parseType(tokenList: TokenList): DataType {
    let token = tokenList.pop();
    if (token.type !== TokenType.Colon) {
        throw new Error(`Expected ':', got '${tokenToString(token.type)}'`);
    }

    token = tokenList.pop();
    if (token.type !== TokenType.Type) {
        throw new Error(`Expected data type, got '${tokenToString(token.type)}'`);
    }

    switch (token.value as string) {
        case 'string':
            return DataType.String;
        case 'i32':
            return DataType.I32;
        case 'void':
            return DataType.Void;
    }

    return DataType.Void;
}

function parseVariableDecl(tokenList: TokenList): VariableDecl {
    const result: VariableDecl = { name: '', type: DataType.String, value: { type: 'i32', data: null }, isArray: false };

    let token = tokenList.pop();
    if (token.type !== TokenType.Let) {
        throw new Error(`Expected 'let', got '${tokenToString(token.type)}'`);
    }

    token = tokenList.pop();
    if (token.type !== TokenType.Identifier) {
        throw new Error(`Expected variable name, got '${tokenToString(token.type)}'`);
    }

    result.name = token.value as string;
    result.type = parseType(tokenList);

    token = tokenList.peek();
    if (token.type === TokenType.LBracket) {
        token = tokenList.pop();
        token = tokenList.pop();
        if (token.type === TokenType.RBracket) {
            result.isArray = true;
        } else {
            throw new Error(`Expected '[]', got ${tokenToString(token.type)}`);
        }
    }

    token = tokenList.pop();
    if (token.type !== TokenType.Assign) {
        throw new Error(`Expected '=', got '${tokenToString(token.type)}'`);
    }

    result.value = parseExpression(tokenList);

    return result;
}

function parseExpression(tokenList: TokenList): Expression {
    // Shunting yard algorithm to convert tokens expression tokens into a proper AST
    // with proper precedence

    const operandsStack: Expression[] = [];
    const operatorStack: Expression[] = [];

    const operand = parseOperand(tokenList);
    operandsStack.push(operand);

    const token = tokenList.peek();
    while (token.type !== TokenType.EOF) {
        const operator = parseOperator(tokenList);
        if (operator.data === null) { break; }

        const currentPrecedence = OPERATOR_PRECEDENCE[operator.data];

        while (operatorStack.length > 0 && OPERATOR_PRECEDENCE[operatorStack[operatorStack.length - 1].data] >= currentPrecedence) {
            const op = operatorStack.pop();
            const right = operandsStack.pop();
            const left = operandsStack.pop();
            operandsStack.push({ type: 'binary-operation', data: { operator: (op as Expression).data, left, right } });
        }


        operatorStack.push(operator);

        const nextOperand = parseOperand(tokenList);
        operandsStack.push(nextOperand);
    }

    while (operatorStack.length > 0) {
        const op = operatorStack.pop();
        const right = operandsStack.pop();
        const left = operandsStack.pop();
        operandsStack.push({ type: 'binary-operation', data: { operator: (op as Expression).data, left, right } });
    }

    return operandsStack[0];
}

function parseOperand(tokenList: TokenList): Expression {
    const result: Expression = { type: 'function-call', data: null };

    const token = tokenList.peek();

    if (token.type === TokenType.String) {
        tokenList.pop();
        result.type = 'string';
        result.data = token.value as string;
    } else if (token.type === TokenType.Number) {
        tokenList.pop();
        result.type = 'i32';
        result.data = token.value as string;
    } else if (token.type === TokenType.True) {
        tokenList.pop();
        result.type = 'bool';
        result.data = 'true';
    } else if (token.type === TokenType.False) {
        tokenList.pop();
        result.type = 'bool';
        result.data = 'false';
    } else if (token.type === TokenType.Identifier) {
        if (tokenList.peek(2).type === TokenType.LParen) {
            result.type = 'function-call';
            result.data = parseFunctionCall(tokenList);
        } else {
            tokenList.pop();
            result.type = 'variable';
            result.data = token.value as string;
        }
    } else if (token.type === TokenType.It) {
        // Maybe this could be just an identifier with a name 'it'
        tokenList.pop();
        result.type = 'variable';
        result.data = 'it';
    } else if (token.type === TokenType.LBracket) {
        // This is an array
        result.type = 'array';
        result.data = parseArray(tokenList);
    } else {
        throw new Error(`Expected expression, got '${tokenToString(token.type)}'`);
    }

    return result;
}

function parseOperator(tokenList: TokenList): Expression {
    const result: Expression = { type: 'operator', data: null };

    const token = tokenList.peek();
    switch (token.type) {
        case TokenType.Plus:
            result.data = Operator.Add;
            break;
        case TokenType.Minus:
            result.data = Operator.Subtract;
            break;
        case TokenType.Asterisk:
            result.data = Operator.Multiply;
            break;
        case TokenType.ForwardSlash:
            result.data = Operator.Divide;
            break;
        case TokenType.LessThan:
            result.data = Operator.LessThan;
            break;
        case TokenType.GreaterThan:
            result.data = Operator.GreaterThan;
            break;
        case TokenType.Equal:
            result.data = Operator.Equal;
            break;
        case TokenType.NotEqual:
            result.data = Operator.NotEqual;
            break;
        case TokenType.LessThanEqual:
            result.data = Operator.LessThanOrEqual;
            break;
        case TokenType.GreaterThanEqual:
            result.data = Operator.GreaterThanOrEqual;
            break;
        case TokenType.And:
            result.data = Operator.And;
            break;
        case TokenType.Or:
            result.data = Operator.Or;
            break;
        case TokenType.Range:
            result.data = Operator.Range;
            break;
    }

    if (result.data !== null) { tokenList.pop(); }

    return result;
}

function parseArray(tokenList: TokenList): Arr {
    const result: Arr = { type: DataType.I32, items: [] };
    let token = tokenList.pop();
    if (token.type !== TokenType.LBracket) {
        throw new Error(`Expected '[', got '${tokenToString(token.type)}'`);
    }

    token = tokenList.peek();
    while (token.type !== TokenType.EOF && token.type !== TokenType.RBracket) {
        result.items.push(parseExpression(tokenList));

        token = tokenList.peek();
        if (token.type !== TokenType.Comma && token.type !== TokenType.RBracket) {
            throw new Error(`Expected ',', got '${tokenToString(token.type)}'`);
        }

        token = tokenList.pop();
    }

    return result;
}

