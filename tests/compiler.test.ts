import { spawn } from 'child_process';
import { compile } from '../src/compiler';

async function runCompiledCode(str: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const cmd = spawn('node', ['-e', str]);
        let result = Buffer.alloc(0);
        let error = Buffer.alloc(0);
        cmd.stdout.on('data', (chunk) => {
            result = Buffer.concat([result, chunk]);
        });
        cmd.stderr.on('data', (chunk) => {
            error = Buffer.concat([error, chunk]);
        });
        cmd.on('exit', () => {
            resolve(result.toString());
        });
        cmd.on('error', () => {
            reject(error.toString());
        });
    });
}

test('hello-world', async () => {
    const result = await compile('./tests/files/hello-world.cog');
    const output = await runCompiledCode(result);
    expect(output.trim()).toBe('hello, world!');
});

test('custom-function-call', async () => {
    const result = await compile('./tests/files/custom-function-call.cog');
    const output = await runCompiledCode(result);
    expect(output.trim()).toBe('hello, world!');
});

test('function-arguments', async () => {
    const result = await compile('./tests/files/function-arguments.cog');
    const output = await runCompiledCode(result);
    expect(output.trim().replace('\r', '')).toBe('Hello, darkness, my old friend\nI come to talk to you again');
});

test('return', async () => {
    const result = await compile('./tests/files/return.cog');
    const output = await runCompiledCode(result);
    expect(output.trim()).toBe('28');
});

test('variables', async () => {
    const result = await compile('./tests/files/variables.cog');
    const output = await runCompiledCode(result);
    expect(output.trim().replace('\r', '')).toBe('6\n9');
});

test('return-to-variable', async () => {
    const result = await compile('./tests/files/return-to-variable.cog');
    const output = await runCompiledCode(result);
    expect(output.trim()).toBe('69');
});

test('boolean', async () => {
    const result = await compile('./tests/files/boolean.cog');
    const output = await runCompiledCode(result);
    expect(output.trim().replace('\r', '')).toBe('true\nfalse');
});

test('binary-operators', async () => {
    const result = await compile('./tests/files/binary-operators.cog');
    const output = await runCompiledCode(result);
    expect(output.trim().replace('\r', '')).toBe('false\ntrue\ntrue\nfalse\ntrue\nfalse\n15\n-3\n54\n0.6666666666666666\n11\n14\n7\n4\n3');
});

test('boolean-operators', async () => {
    const result = await compile('./tests/files/boolean-operators.cog');
    const output = await runCompiledCode(result);
    expect(output.trim().replace('\r', '')).toBe('false\ntrue');
});

test('control-flow', async () => {
    const result = await compile('./tests/files/control-flow.cog');
    const output = await runCompiledCode(result);
    expect(output.trim().replace('\r', '')).toBe('Nice\nGoodbye!\nLess less');
});

test('comments', async () => {
    const result = await compile('./tests/files/comments.cog');
    const output = await runCompiledCode(result);
    expect(output.trim().replace('\r', '')).toBe('comment above\ncomment inline');
});

test('range-loop', async () => {
    const result = await compile('./tests/files/range-loop.cog');
    const output = await runCompiledCode(result);
    expect(output.trim().replace('\r', '')).toBe('0\n1\n2\n3\n4\n5\n6\n7\n8\n9');
});

test('custom-loop-item', async () => {
    const result = await compile('./tests/files/custom-loop-item.cog');
    const output = await runCompiledCode(result);
    expect(output.trim().replace('\r', '')).toBe('0\n1\n2\n3\n4\n5\n6\n7\n8\n9');
});

test('infinite-loop', async () => {
    const result = await compile('./tests/files/infinite-loop.cog');
    const output = await runCompiledCode(result);
    expect(output.trim().replace('\r', '')).toBe('started\nstopped');
});

test('continue', async () => {
    const result = await compile('./tests/files/continue.cog');
    const output = await runCompiledCode(result);
    expect(output.trim().replace('\r', '')).toBe('0\n1\nready to break');
});
