import { BinaryOp, Block, Expression, ForStatement, Func, FunctionCall, IfStatement, MatchCase, MatchStatement, Operator, Parameter, ParsedFile, VariableDecl } from './parser';

export function translate(parsedFile: ParsedFile): string {
    const result: string[] = [];

    for (const func of parsedFile.funcs) {
        result.push(...translateFunction(func, parsedFile));
        result.push('');
    }

    if (parsedFile.funcs.findIndex(func => func.name === 'main') !== -1) {
        result.push('main();');
    }

    return result.join('\n');
}

function translateFunction(func: Func, context: ParsedFile): string[] {
    const result: string[] = [];

    result.push(`function ${func.name}(${translateFunctionParams(func.params)}) {`);
    result.push(...translateBlock(func.block, context, 1));
    result.push('}');

    return result;
}

function translateFunctionParams(params: Parameter[]): string {
    return params.map(param => param.name).join(', ');
}

function translateBlock(block: Block, context: ParsedFile, indentLevel: number): string[] {
    const result: string[] = [];

    const defers: string[] = [];

    const indent = ' '.repeat(indentLevel * 4);

    for (const statement of block.statements) {
        switch (statement.type) {
            case 'expression':
                result.push(`${indent}${translateExpression(statement.data, context)}`);
                break;
            case 'return':
                result.push(`${indent}return ${translateExpression(statement.data, context)};`);
                break;
            case 'variable-decl':
                result.push(`${indent}${translateVariableDecl(statement.data, context)}`);
                break;
            case 'if-statement':
                result.push(translateIfStatement(statement.data, context, indentLevel));
                break;
            case 'match-statement':
                result.push(translateMatchStatement(statement.data, context, indentLevel));
                break;
            case 'for-statement':
                result.push(...translateForStatement(statement.data, context, indentLevel));
                break;
            case 'break':
                result.push(`${indent}break;`);
                break;
            case 'skip':
                result.push(`${indent}continue`);
                break;
            case 'defer': {
                const deferName = `defer_${defers.length}`;
                defers.push(deferName);
                result.push(`${indent}const ${deferName} = () => { ${translateExpression(statement.data, context)}; };`);
                break;
            }
        }
    }

    if (defers.length > 0) {
        for (const defer of defers) {
            result.push(`${indent}${defer}();`);
        }
    }

    return result;
}

function translateIfStatement(st: IfStatement, context: ParsedFile, indentLevel: number): string {
    const result: string[] = [];

    const indent = ' '.repeat(indentLevel * 4);

    const ifcondition = translateExpression(st.if.condition, context);
    const ifblock = translateBlock(st.if.block, context, indentLevel + 1);

    result.push(`${indent}if (${ifcondition}) {`);
    for (const line of ifblock) {
        result.push(line);
    }

    for (const elif of st.elseif) {
        const elifcondition = translateExpression(elif.condition, context);
        const elifblock = translateBlock(elif.block, context, indentLevel + 1);

        result.push(`${indent}} else if (${elifcondition}) {`);
        for (const line of elifblock) {
            result.push(line);
        }
    }

    if (st.else) {
        result.push(`${indent}} else {`);
        const elseBlock = translateBlock(st.else.block, context, indentLevel + 1);
        for (const line of elseBlock) {
            result.push(line);
        }
    }

    result.push(`${indent}}`);
    return result.join('\n');
}

function translateMatchStatement(st: MatchStatement, context: ParsedFile, indentLevel: number): string {
    const result: string[] = [];

    const indent = ' '.repeat(indentLevel * 4);
    const nextIndent = ' '.repeat((indentLevel + 1) * 4);
    const nextnextIndent = ' '.repeat((indentLevel + 2) * 4);

    const pattern = translateExpression(st.pattern, context);
    result.push(`${indent}switch (${pattern}) {`);
    for (const c of st.cases) {
        result.push(...translateMatchCase(c, context, indentLevel + 1));
    }
    if (st.else) {
        result.push(`${nextIndent}default: {`);
        result.push(...translateBlock(st.else, context, indentLevel + 2));
        result.push(`${nextnextIndent}break;`);
        result.push(`${nextIndent}}`);
    }
    result.push(`${indent}}`);

    return result.join('\n');
}

function translateMatchCase(c: MatchCase, context: ParsedFile, indentLevel: number): string[] {
    const result: string[] = [];

    const indent = ' '.repeat(indentLevel * 4);
    const nextIndent = ' '.repeat((indentLevel + 1) * 4);

    result.push(`${indent}case ${translateExpression(c.pattern, context)}: {`);
    result.push(...translateBlock(c.block, context, indentLevel + 1));
    result.push(`${nextIndent}break;`);
    result.push(`${indent}}`);

    return result;
}

function translateForStatement(st: ForStatement, context: ParsedFile, indentLevel: number): string[] {
    const result: string[] = [];

    const indent = ' '.repeat(indentLevel * 4);

    if (st.expression) {
        const itemName = st.item || 'it';

        if (st.expression.data.operator === Operator.Range) {
            const [start, end] = translateRangeExpression(st.expression.data, context);
            result.push(`${indent}for (let ${itemName} = ${start}; ${itemName} < ${end}; ${itemName}++) {`);
            result.push(...translateBlock(st.block, context, indentLevel + 1));
            result.push(`${indent}}`);
        } else if (st.expression.type === 'variable') {
            result.push(`${indent}for (const ${itemName} of ${translateExpression(st.expression, context)}) {`);
            result.push(...translateBlock(st.block, context, indentLevel + 1));
            result.push(`${indent}}`);
        }
    } else {
        result.push('\twhile (true) {');
        result.push(...translateBlock(st.block, context, indentLevel + 1));
        result.push('\t}');
    }

    return result;
}

function translateExpression(expression: Expression, context: ParsedFile): string {
    switch (expression.type) {
        case 'function-call':
            return translateFunctionCall(expression.data, context);
        case 'string':
            return `'${expression.data as string}'`;
        case 'i32':
        case 'bool':
        case 'variable':
            return expression.data as string;
        case 'operator':
            // Just an operator cannot be an expression
            break;
        case 'binary-operation': {
            const left = translateExpression(expression.data.left, context);
            const right = translateExpression(expression.data.right, context);

            const op = translateOperator(expression.data.operator);

            return `${left} ${op} ${right}`;
        }
        case 'array':
            return `[${expression.data.items.map((e: Expression) => translateExpression(e, context)).join(', ')}]`;
    }

    return '';
}

function translateRangeExpression(expression: BinaryOp, context: ParsedFile): [string, string] {
    const start = translateExpression(expression.left, context);
    const end = translateExpression(expression.right, context);

    return [start, end];
}

function translateFunctionCall(call: FunctionCall, context: ParsedFile): string {
    const args = call.arguments.map((arg: Expression) => {
        return translateExpression(arg, context);
    }).join(', ');

    if (call.name === 'print') {
        // Intrinsic print function
        return `console.log(${args});`;
    }

    if (context.funcs.findIndex(func => func.name === call.name) !== -1) {
        return `${call.name}(${args})`;
    }

    return '';
}

function translateVariableDecl(decl: VariableDecl, context: ParsedFile): string {
    return `const ${decl.name} = ${translateExpression(decl.value, context)};`;
}

function translateOperator(operator: Operator): string {
    switch (operator) {
        case Operator.Add:
            return '+';
        case Operator.Subtract:
            return '-';
        case Operator.Multiply:
            return '*';
        case Operator.Divide:
            return '/';
        case Operator.Equal:
            return '===';
        case Operator.NotEqual:
            return '!==';
        case Operator.LessThan:
            return '<';
        case Operator.LessThanOrEqual:
            return '<=';
        case Operator.GreaterThan:
            return '>';
        case Operator.GreaterThanOrEqual:
            return '>=';
        case Operator.And:
            return '&&';
        case Operator.Or:
            return '||';
        default:
            return '';
    }
}
