import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted mock for the lib database module (so the api handler uses the mock)
vi.mock('../../lib/database', () => {
    const mockDb: any = {
        logAction: vi.fn(),
        getUserByMinecraftUuid: vi.fn(),
        getVerificationByCode: vi.fn(),
        completeVerification: vi.fn(),
    };
    return { db: mockDb };
});

import { db as mockDb } from '../../lib/database';
import handler from '../../api/minecraft';

describe('api/minecraft handlers', () => {
    beforeEach(() => {
        for (const k of Object.keys(mockDb)) mockDb[k].mockReset && mockDb[k].mockReset();
    });

    it('player_join action returns linked message when user verified', async () => {
        process.env.MC_SERVER_API_KEY = 'key';

        const req = {
            method: 'POST',
            headers: { authorization: `Bearer ${process.env.MC_SERVER_API_KEY}` },
            body: { action: 'player_join', playerUuid: 'uuid', playerName: 'Steve' },
        } as any;

        const jsonSpy = vi.fn();
        const res = {
            status: vi.fn().mockReturnThis(),
            json: jsonSpy,
        } as any;

        (mockDb.getUserByMinecraftUuid as any).mockResolvedValue({ isVerified: true, discordTag: 'foo#1234' });

        await handler(req as any, res as any);

        expect(mockDb.logAction).toHaveBeenCalled();
        expect(mockDb.getUserByMinecraftUuid).toHaveBeenCalledWith('uuid');
        expect(jsonSpy).toHaveBeenCalled();
    });
});
