import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock discord-interactions verifyKey for deterministic tests
vi.mock('discord-interactions', () => ({
    verifyKey: (body: string, signature: string, timestamp: string, publicKey: string) => {
        // simple deterministic behavior for tests
        return publicKey === 'valid_key' && signature === 'sig' && timestamp === 'ts' && body === 'body';
    },
}));

import {
    createErrorResponse,
    createSuccessResponse,
    createEmbedResponse,
    createDeferredResponse,
    getEnvironmentVariable,
    verifyDiscordRequest,
} from '../utils';

describe('responses and env utilities', () => {
    beforeEach(() => {
        // ensure the environment var is not leaking between tests
        delete process.env.DISCORD_PUBLIC_KEY;
    });

    it('creates an error response with expected shape', async () => {
        const res = createErrorResponse('Something went wrong');
        expect(res.status).toBe(200);
        const text = await res.text();
        const json = JSON.parse(text);
        expect(json.type).toBe(4);
        expect(json.data.content).toContain('Error');
    });

    it('creates a success response and respects ephemeral flag', async () => {
        const res = createSuccessResponse('All good', true);
        const json = JSON.parse(await res.text());
        expect(json.data.content).toContain('Success');
        expect(json.data.flags).toBe(64);
    });

    it('creates an embed response', async () => {
        const embed = { title: 'Test', description: 'desc' };
        const res = createEmbedResponse(embed, false);
        const json = JSON.parse(await res.text());
        expect(Array.isArray(json.data.embeds)).toBe(true);
        expect(json.data.embeds[0].title).toBe('Test');
    });

    it('creates a deferred response', async () => {
        const res = createDeferredResponse();
        const json = JSON.parse(await res.text());
        expect(json.type).toBe(5);
    });

    it('getEnvironmentVariable returns value or throws when required', () => {
        process.env.MY_TEST_VAR = 'abc';
        expect(getEnvironmentVariable('MY_TEST_VAR')).toBe('abc');
        delete process.env.MY_TEST_VAR;
        expect(() => getEnvironmentVariable('MY_TEST_VAR')).toThrow();
        // optional parameter should return empty string when not required
        expect(getEnvironmentVariable('MY_TEST_VAR', false)).toBe('');
    });

    it('verifyDiscordRequest uses verifyKey and env var', async () => {
        // happy path
        process.env.DISCORD_PUBLIC_KEY = 'valid_key';
        const req = new Request('http://localhost', {
            method: 'POST',
            headers: {
                'X-Signature-Ed25519': 'sig',
                'X-Signature-Timestamp': 'ts',
            },
            body: 'body',
        });

        const ok = await verifyDiscordRequest(req as Request);
        expect(ok).toBe(true);

        // missing headers => false
        const badReq = new Request('http://localhost', { method: 'POST', body: 'body' });
        const ok2 = await verifyDiscordRequest(badReq as Request);
        expect(ok2).toBe(false);

        // missing env => throws
        delete process.env.DISCORD_PUBLIC_KEY;
        await expect(verifyDiscordRequest(req as Request)).rejects.toThrow();
    });
});
