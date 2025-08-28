import { describe, it, expect } from 'vitest';
import {
    isValidMinecraftUsername,
    isValidMinecraftUUID,
    formatMinecraftUUID,
    sanitizeInput,
    getDiscordUserTag,
    RateLimiter,
} from '../utils';

describe('utils', () => {
    it('validates minecraft usernames correctly', () => {
        expect(isValidMinecraftUsername('Steve')).toBe(true);
        expect(isValidMinecraftUsername('ab')).toBe(false);
        expect(isValidMinecraftUsername('this_is_way_too_long_for_minecraft')).toBe(false);
        expect(isValidMinecraftUsername('John_Doe')).toBe(true);
    });

    it('validates and formats uuid correctly', () => {
        const raw = '123e4567e89b12d3a456426655440000';
        const formatted = formatMinecraftUUID(raw);
        expect(isValidMinecraftUUID(formatted)).toBe(true);
        expect(formatted).toBe('123e4567-e89b-12d3-a456-426655440000');
    });

    it('sanitizes input and trims to length', () => {
        const dirty = '  <@!123> Hello #world!  ';
        const clean = sanitizeInput(dirty, 50);
        expect(clean).toBe('123 Hello world');
    });

    it('formats discord tag correctly', () => {
        expect(getDiscordUserTag({ username: 'foo', discriminator: '0' })).toBe('@foo');
        expect(getDiscordUserTag({ username: 'bar', discriminator: '1234' })).toBe('bar#1234');
    });

    it('rate limiter enforces limits', () => {
        const rl = new RateLimiter(2, 1000); // 2 requests per second
        const id = 'user1';

        expect(rl.isRateLimited(id)).toBe(false);
        expect(rl.isRateLimited(id)).toBe(false);
        // third within window should be limited
        expect(rl.isRateLimited(id)).toBe(true);
    });
});
