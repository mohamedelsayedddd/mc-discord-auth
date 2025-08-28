import { verifyKey } from 'discord-interactions';

export async function verifyDiscordRequest(request: Request): Promise<boolean> {
    const signature = request.headers.get('X-Signature-Ed25519');
    const timestamp = request.headers.get('X-Signature-Timestamp');

    if (!signature || !timestamp) {
        return false;
    }

    const publicKey = process.env.DISCORD_PUBLIC_KEY;
    if (!publicKey) {
        throw new Error('DISCORD_PUBLIC_KEY environment variable is required');
    }

    const body = await request.text();
    return verifyKey(body, signature, timestamp, publicKey);
}

export function createErrorResponse(message: string): Response {
    return new Response(
        JSON.stringify({
            type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
            data: {
                content: `❌ **Error:** ${message}`,
                flags: 64, // EPHEMERAL
            },
        }),
        {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        }
    );
}

export function createSuccessResponse(message: string, ephemeral = false): Response {
    return new Response(
        JSON.stringify({
            type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
            data: {
                content: `✅ **Success:** ${message}`,
                flags: ephemeral ? 64 : 0, // EPHEMERAL if specified
            },
        }),
        {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        }
    );
}

export function createEmbedResponse(embed: any, ephemeral = false): Response {
    return new Response(
        JSON.stringify({
            type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
            data: {
                embeds: [embed],
                flags: ephemeral ? 64 : 0,
            },
        }),
        {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        }
    );
}

export function createDeferredResponse(): Response {
    return new Response(
        JSON.stringify({
            type: 5, // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
        }),
        {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        }
    );
}

export function getDiscordUserTag(user: any): string {
    return user.discriminator === '0'
        ? `@${user.username}`
        : `${user.username}#${user.discriminator}`;
}

export function isValidMinecraftUsername(username: string): boolean {
    return /^\w{3,16}$/.test(username);
}

export function isValidMinecraftUUID(uuid: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

export function formatMinecraftUUID(uuid: string): string {
    // Remove dashes and add them back in the correct format
    const clean = uuid.replace(/-/g, '');
    return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20, 32)}`;
}

export function sanitizeInput(input: string, maxLength = 100): string {
    return input.trim().slice(0, maxLength).replace(/[<>@#&!]/g, '');
}

export function getEnvironmentVariable(name: string, required = true): string {
    const value = process.env[name];

    if (required && !value) {
        throw new Error(`Environment variable ${name} is required but not set`);
    }

    return value || '';
}

export class RateLimiter {
    private requests: Map<string, number[]> = new Map();
    private readonly limit: number;
    private readonly windowMs: number;

    constructor(limit = 5, windowMs = 60000) {
        this.limit = limit;
        this.windowMs = windowMs;
    }

    isRateLimited(identifier: string): boolean {
        const now = Date.now();
        const requests = this.requests.get(identifier) || [];

        // Remove old requests outside the window
        const validRequests = requests.filter(time => now - time < this.windowMs);

        if (validRequests.length >= this.limit) {
            return true;
        }

        // Add current request
        validRequests.push(now);
        this.requests.set(identifier, validRequests);

        return false;
    }

    cleanup(): void {
        const now = Date.now();
        for (const [identifier, requests] of this.requests.entries()) {
            const validRequests = requests.filter(time => now - time < this.windowMs);
            if (validRequests.length === 0) {
                this.requests.delete(identifier);
            } else {
                this.requests.set(identifier, validRequests);
            }
        }
    }
}
