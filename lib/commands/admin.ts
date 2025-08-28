import { DiscordInteraction, COLORS, EMOJI } from '../types';
import { db } from '../database';
import { minecraftService } from '../minecraft';
import { createErrorResponse, createEmbedResponse } from '../utils';

export async function handleAdminCommand(interaction: DiscordInteraction): Promise<Response> {
    const user = interaction.member?.user || interaction.user;
    if (!user) {
        return createErrorResponse('Could not identify user');
    }

    // Check if user has admin permissions (you can customize this check)
    const adminRoles = process.env.ADMIN_ROLES?.split(',') || [];
    const userRoles = interaction.member?.roles || [];
    const isAdmin = adminRoles.some(role => userRoles.includes(role)) ||
        user.id === process.env.ADMIN_USER_ID;

    if (!isAdmin) {
        return createErrorResponse('You do not have permission to use this command');
    }

    const options = ((interaction.data as any)?.options) || [];
    const subcommand = options[0]?.name;

    switch (subcommand) {
        case 'stats':
            return await handleStatsSubcommand();
        case 'cleanup':
            return await handleCleanupSubcommand();
        case 'server':
            return await handleServerSubcommand();
        default:
            return createErrorResponse('Unknown admin subcommand');
    }
}

async function handleStatsSubcommand(): Promise<Response> {
    try {
        const stats = await db.getUserStats();

        return createEmbedResponse({
            title: `${EMOJI.INFO} System Statistics`,
            color: COLORS.INFO,
            fields: [
                {
                    name: 'Total Users',
                    value: stats.total.toString(),
                    inline: true,
                },
                {
                    name: 'Verified Users',
                    value: stats.verified.toString(),
                    inline: true,
                },
                {
                    name: 'Unverified Users',
                    value: stats.unverified.toString(),
                    inline: true,
                },
                {
                    name: 'Verification Rate',
                    value: stats.total > 0 ? `${Math.round((stats.verified / stats.total) * 100)}%` : '0%',
                    inline: true,
                },
            ],
            footer: { text: 'Statistics as of now' },
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return createErrorResponse('Failed to fetch statistics');
    }
}

async function handleCleanupSubcommand(): Promise<Response> {
    try {
        await db.cleanupExpired();

        return createEmbedResponse({
            title: `${EMOJI.SUCCESS} Cleanup Complete`,
            description: 'Successfully cleaned up expired tokens and verifications.',
            color: COLORS.SUCCESS,
            footer: { text: 'Database maintenance completed' },
        });
    } catch (error) {
        console.error('Error during cleanup:', error);
        return createErrorResponse('Failed to cleanup database');
    }
}

async function handleServerSubcommand(): Promise<Response> {
    try {
        const serverStatus = await minecraftService.getServerStatus();

        return createEmbedResponse({
            title: `${EMOJI.MINECRAFT} Minecraft Server Status`,
            color: serverStatus.online ? COLORS.SUCCESS : COLORS.ERROR,
            fields: [
                {
                    name: 'Status',
                    value: serverStatus.online ? `${EMOJI.SUCCESS} Online` : `${EMOJI.ERROR} Offline`,
                    inline: true,
                },
                {
                    name: 'Players',
                    value: `${serverStatus.players}/${serverStatus.maxPlayers}`,
                    inline: true,
                },
                {
                    name: 'Server URL',
                    value: process.env.MC_SERVER_URL || 'Not configured',
                    inline: false,
                },
            ],
            footer: { text: 'Server status as of now' },
        });
    } catch (error) {
        console.error('Error fetching server status:', error);
        return createErrorResponse('Failed to fetch server status');
    }
}

export const ADMIN_COMMAND = {
    name: 'admin',
    description: 'Admin commands for managing the authentication system',
    options: [
        {
            name: 'stats',
            description: 'View system statistics',
            type: 1, // SUB_COMMAND
        },
        {
            name: 'cleanup',
            description: 'Clean up expired tokens and verifications',
            type: 1, // SUB_COMMAND
        },
        {
            name: 'server',
            description: 'Check Minecraft server status',
            type: 1, // SUB_COMMAND
        },
    ],
};
