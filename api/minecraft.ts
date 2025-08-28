import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../lib/database';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify API key
        const apiKey = req.headers.authorization?.replace('Bearer ', '');
        if (!apiKey || apiKey !== process.env.MC_SERVER_API_KEY) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        const { action, playerUuid, playerName, data } = req.body;

        switch (action) {
            case 'player_join':
                return await handlePlayerJoin(res, playerUuid, playerName);

            case 'player_leave':
                return await handlePlayerLeave(res, playerUuid, playerName);

            case 'verify_player':
                return await handleVerifyPlayer(res, playerUuid, playerName, data?.verificationCode);

            case 'get_player_status':
                return await handleGetPlayerStatus(res, playerUuid);

            default:
                return res.status(400).json({ error: 'Unknown action' });
        }

    } catch (error) {
        console.error('Error handling Minecraft API request:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function handlePlayerJoin(res: VercelResponse, playerUuid: string, playerName: string) {
    try {
        // Log player join
        await db.logAction('player_join', undefined, {
            minecraftUuid: playerUuid,
            minecraftName: playerName,
        });

        // Check if player has linked account
        const user = await db.getUserByMinecraftUuid(playerUuid);

        if (user?.isVerified) {
            return res.json({
                success: true,
                message: `Welcome back, ${playerName}! Your Discord account is linked.`,
                linkedDiscord: true,
                discordTag: user.discordTag,
            });
        }

        return res.json({
            success: true,
            message: `Welcome, ${playerName}! Use /link in Discord to connect your accounts.`,
            linkedDiscord: false,
        });

    } catch (error) {
        console.error('Error handling player join:', error);
        return res.status(500).json({ error: 'Failed to process player join' });
    }
}

async function handlePlayerLeave(res: VercelResponse, playerUuid: string, playerName: string) {
    try {
        // Log player leave
        await db.logAction('player_leave', undefined, {
            minecraftUuid: playerUuid,
            minecraftName: playerName,
        });

        return res.json({ success: true });

    } catch (error) {
        console.error('Error handling player leave:', error);
        return res.status(500).json({ error: 'Failed to process player leave' });
    }
}

async function handleVerifyPlayer(res: VercelResponse, playerUuid: string, playerName: string, verificationCode?: string) {
    try {
        if (!verificationCode) {
            return res.status(400).json({ error: 'Verification code is required' });
        }

        // Find the verification
        const verification = await db.getVerificationByCode(verificationCode.toUpperCase());

        if (!verification) {
            return res.json({
                success: false,
                message: 'Invalid or expired verification code.',
            });
        }

        // Check if the player matches
        if (verification.minecraftUuid !== playerUuid || verification.minecraftName !== playerName) {
            return res.json({
                success: false,
                message: 'Verification code does not match this player.',
            });
        }

        // Complete verification
        const user = await db.completeVerification(verificationCode.toUpperCase());

        if (user) {
            return res.json({
                success: true,
                message: `Account successfully linked to Discord user ${user.discordTag}!`,
                discordTag: user.discordTag,
            });
        } else {
            return res.json({
                success: false,
                message: 'Verification failed. Please try again.',
            });
        }

    } catch (error) {
        console.error('Error handling player verification:', error);
        return res.status(500).json({ error: 'Failed to process verification' });
    }
}

async function handleGetPlayerStatus(res: VercelResponse, playerUuid: string) {
    try {
        const user = await db.getUserByMinecraftUuid(playerUuid);

        return res.json({
            success: true,
            linkedDiscord: user?.isVerified || false,
            discordTag: user?.discordTag || null,
            linkedAt: user?.createdAt || null,
        });

    } catch (error) {
        console.error('Error getting player status:', error);
        return res.status(500).json({ error: 'Failed to get player status' });
    }
}
