import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted mock for ../prisma so the real client isn't initialized.
vi.mock('../prisma', () => {
    const mockPrisma: any = {
        user: {
            upsert: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            count: vi.fn(),
        },
        authToken: {
            create: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            deleteMany: vi.fn(),
        },
        verification: {
            create: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
        },
        auditLog: { create: vi.fn() },
    };

    return { prisma: mockPrisma };
});

import { prisma as mockPrisma } from '../prisma';
import { DatabaseService } from '../database';

describe('DatabaseService', () => {
    let db: DatabaseService;

    beforeEach(() => {
        db = new DatabaseService();
        // reset mocks
        for (const key of Object.keys(mockPrisma)) {
            const val = (mockPrisma as any)[key];
            for (const fn of Object.keys(val)) {
                val[fn].mockReset && val[fn].mockReset();
            }
        }
    });

    it('upserts a user', async () => {
        const expected = { id: 'u1', discordId: 'd1', discordTag: 'tag' };
        mockPrisma.user.upsert.mockResolvedValue(expected);

        const res = await db.upsertUser('d1', 'tag');
        expect(res).toBe(expected);
        expect(mockPrisma.user.upsert).toHaveBeenCalled();
    });

    it('creates an auth token', async () => {
        const created = { token: 'tok', userId: 'u1', expiresAt: new Date() };
        mockPrisma.authToken.create.mockResolvedValue(created);

        const res = await db.createAuthToken('u1');
        expect(res).toBe(created);
        expect(mockPrisma.authToken.create).toHaveBeenCalled();
    });

    it('completes verification when pending and returns updated user', async () => {
        const verification = {
            id: 'v1',
            userId: 'u1',
            minecraftUuid: 'uuid',
            minecraftName: 'name',
            status: 'PENDING',
            expiresAt: new Date(Date.now() + 10000),
        } as any;

        const updatedUser = { id: 'u1', discordTag: 'foo', minecraftUuid: 'uuid' };

        mockPrisma.verification.findUnique.mockResolvedValue(verification);
        mockPrisma.verification.update.mockResolvedValue({ ...verification, status: 'COMPLETED' });
        mockPrisma.user.update.mockResolvedValue(updatedUser);

        const res = await db.completeVerification('CODE');
        expect(res).toBe(updatedUser);
        expect(mockPrisma.verification.update).toHaveBeenCalled();
        expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('getUserStats returns counts', async () => {
        mockPrisma.user.count.mockImplementation((args: any) => {
            if (args && args.where && args.where.isVerified) return Promise.resolve(2);
            return Promise.resolve(5);
        });

        const stats = await db.getUserStats();
        expect(stats.total).toBe(5);
        expect(stats.verified).toBe(2);
        expect(stats.unverified).toBe(3);
    });
});
