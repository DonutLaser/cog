import * as fs from 'fs/promises';

import { translate } from './codegen';
import { lex } from './lexer';
import { parse } from './parser';

export interface CompilerOptions {
    dumpTokens: boolean;
    dumpAST: boolean
}

export async function compile(srcFilename: string, options: CompilerOptions): Promise<string> {
    let src = '';
    try {
        src = await fs.readFile(srcFilename, 'utf8');
    } catch (err) {
        console.error(`Could not read file ${srcFilename}`);
        return '';
    }

    const tokenList = lex(src);
    if (options.dumpTokens) {
        tokenList.dump();
        return '';
    }

    const parsedSrc = parse(tokenList);
    if (options.dumpAST) {
        console.log('', JSON.stringify(parsedSrc, null, 2));
        return '';
    }

    return translate(parsedSrc);
}
