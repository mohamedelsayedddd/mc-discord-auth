import { User, AuthToken, Verification, VerificationStatus } from '@prisma/client';
import { prisma } from './prisma';
import { v4 as uuidv4 } from 'uuid';

export class DatabaseService {
    /**
     * Create or update a user with Discord information
     */
    async upsertUser(discordId: string, discordTag: string): Promise<User> {
        return await prisma.user.upsert({
            where: { discordId },
            update: { discordTag },
            create: {
                discordId,
                discordTag,
            },
        });
    }

    /**
     * Get user by Discord ID
     */
    async getUserByDiscordId(discordId: string): Promise<User | null> {
        return await prisma.user.findUnique({
            where: { discordId },
            include: {
                authTokens: true,
                verifications: {
                    where: {
                        status: VerificationStatus.PENDING,
                        expiresAt: {
                            gt: new Date(),
                        },
                    },
                },
            },
        });
    }

    /**
     * Get user by Minecraft UUID
     */
    async getUserByMinecraftUuid(minecraftUuid: string): Promise<User | null> {
        return await prisma.user.findUnique({
            where: { minecraftUuid },
        });
    }

    /**
     * Create an authentication token for Minecraft verification
     */
    async createAuthToken(userId: string): Promise<AuthToken> {
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        return await prisma.authToken.create({
            data: {
                token,
                userId,
                expiresAt,
            },
        });
    }

    /**
     * Get valid auth token
     */
    async getValidAuthToken(token: string): Promise<AuthToken | null> {
        return await prisma.authToken.findUnique({
            where: { token },
            include: { user: true },
        });
    }

    /**
     * Mark auth token as used
     */
    async markTokenAsUsed(token: string): Promise<void> {
        await prisma.authToken.update({
            where: { token },
            data: { isUsed: true },
        });
    }

    /**
     * Create a verification request
     */
    async createVerification(
        userId: string,
        minecraftUuid: string,
        minecraftName: string
    ): Promise<Verification> {
        const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        return await prisma.verification.create({
            data: {
                userId,
                minecraftUuid,
                minecraftName,
                verificationCode,
                expiresAt,
            },
        });
    }

    /**
     * Get verification by code
     */
    async getVerificationByCode(verificationCode: string): Promise<Verification | null> {
        return await prisma.verification.findUnique({
            where: { verificationCode },
            include: { user: true },
        });
    }

    /**
     * Complete verification and link accounts
     */
    async completeVerification(verificationCode: string): Promise<User | null> {
        const verification = await this.getVerificationByCode(verificationCode);

        if (!verification || verification.status !== VerificationStatus.PENDING || verification.expiresAt < new Date()) {
            return null;
        }

        // Update verification status
        await prisma.verification.update({
            where: { id: verification.id },
            data: { status: VerificationStatus.COMPLETED },
        });

        // Update user with Minecraft information
        const updatedUser = await prisma.user.update({
            where: { id: verification.userId },
            data: {
                minecraftUuid: verification.minecraftUuid,
                minecraftName: verification.minecraftName,
                isVerified: true,
            },
        });

        return updatedUser;
    }

    /**
     * Get user statistics
     */
    async getUserStats(): Promise<{ total: number; verified: number; unverified: number }> {
        const [total, verified] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isVerified: true } }),
        ]);

        return {
            total,
            verified,
            unverified: total - verified,
        };
    }

    /**
     * Log an action for audit purposes
     */
    async logAction(
        action: string,
        userId?: string,
        details?: any,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        await prisma.auditLog.create({
            data: {
                action,
                userId,
                details,
                ipAddress,
                userAgent,
            },
        });
    }

    /**
     * Unlink accounts by removing Minecraft information
     */
    async unlinkAccounts(userId: string): Promise<User | null> {
        return await prisma.user.update({
            where: { id: userId },
            data: {
                minecraftUuid: null,
                minecraftName: null,
                isVerified: false,
            },
        });
    }

    /**
     * Clean up expired tokens and verifications
     */
    async cleanupExpired(): Promise<void> {
        const now = new Date();

        await Promise.all([
            // Delete expired auth tokens
            prisma.authToken.deleteMany({
                where: {
                    OR: [
                        { expiresAt: { lt: now } },
                        { isUsed: true },
                    ],
                },
            }),
            // Update expired verifications
            prisma.verification.updateMany({
                where: {
                    expiresAt: { lt: now },
                    status: VerificationStatus.PENDING,
                },
                data: {
                    status: VerificationStatus.EXPIRED,
                },
            }),
        ]);
    }
}

export const db = new DatabaseService();
