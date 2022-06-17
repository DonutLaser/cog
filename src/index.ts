import * as fs from 'fs/promises';

import { compile, CompilerOptions } from './compiler';

async function start() {
    const args = process.argv.slice(2);
    const srcFilename = args[0];
    if (!srcFilename) {
        console.error('Must specify the source file to compile');
        return;
    }

    const options: CompilerOptions = {
        dumpTokens: args[1] === '--lex',
        dumpAST: args[1] === '--ast'
    };
    const result = await compile(srcFilename, options);
    if (result) {
        await fs.writeFile('main.js', result);
    }
}

start();
