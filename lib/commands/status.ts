import { DiscordInteraction, COLORS, EMOJI } from '../types';
import { db } from '../database';
import { createErrorResponse, createEmbedResponse, getDiscordUserTag } from '../utils';

export async function handleStatusCommand(interaction: DiscordInteraction): Promise<Response> {
    const user = interaction.member?.user || interaction.user;
    if (!user) {
        return createErrorResponse('Could not identify user');
    }

    try {
        // Get user from database
        const dbUser = await db.getUserByDiscordId(user.id);
        const discordTag = getDiscordUserTag(user);

        if (!dbUser) {
            return createEmbedResponse({
                title: `${EMOJI.INFO} Account Status`,
                description: 'Your Discord account is not registered in our system.',
                color: COLORS.INFO,
                fields: [
                    {
                        name: 'Discord Account',
                        value: discordTag,
                        inline: true,
                    },
                    {
                        name: 'Minecraft Account',
                        value: 'Not linked',
                        inline: true,
                    },
                    {
                        name: 'Status',
                        value: `${EMOJI.ERROR} Unverified`,
                        inline: true,
                    },
                ],
                footer: { text: 'Use /link <username> to start linking your accounts' },
            }, true);
        }

        if (!dbUser.isVerified || !dbUser.minecraftName) {
            // Check for pending verifications if present
            const pendingVerifications = Array.isArray((dbUser as any).verifications)
                ? (dbUser as any).verifications.filter((v: any) =>
                    v.status === 'PENDING' && new Date(v.expiresAt) > new Date()
                )
                : [];

            return createEmbedResponse({
                title: `${EMOJI.WARNING} Account Status`,
                description: pendingVerifications.length > 0
                    ? 'You have a pending verification request.'
                    : 'Your accounts are not yet linked.',
                color: COLORS.WARNING,
                fields: [
                    {
                        name: 'Discord Account',
                        value: discordTag,
                        inline: true,
                    },
                    {
                        name: 'Minecraft Account',
                        value: pendingVerifications.length > 0
                            ? `Pending: ${pendingVerifications[0].minecraftName}`
                            : 'Not linked',
                        inline: true,
                    },
                    {
                        name: 'Status',
                        value: pendingVerifications.length > 0
                            ? `${EMOJI.LOADING} Verification Pending`
                            : `${EMOJI.ERROR} Unverified`,
                        inline: true,
                    },
                ],
                footer: {
                    text: pendingVerifications.length > 0
                        ? `Use /verify <code> to complete verification`
                        : 'Use /link <username> to start linking your accounts'
                },
            }, true);
        }

        return createEmbedResponse({
            title: `${EMOJI.SUCCESS} Account Status`,
            description: 'Your accounts are successfully linked!',
            color: COLORS.SUCCESS,
            fields: [
                {
                    name: 'Discord Account',
                    value: discordTag,
                    inline: true,
                },
                {
                    name: 'Minecraft Account',
                    value: dbUser.minecraftName,
                    inline: true,
                },
                {
                    name: 'Status',
                    value: `${EMOJI.LINK} Verified`,
                    inline: true,
                },
                {
                    name: 'Linked Since',
                    value: `<t:${Math.floor(dbUser.createdAt.getTime() / 1000)}:R>`,
                    inline: true,
                },
                {
                    name: 'Last Updated',
                    value: `<t:${Math.floor(dbUser.updatedAt.getTime() / 1000)}:R>`,
                    inline: true,
                },
            ],
        }, true);

    } catch (error) {
        console.error('Error in status command:', error);
        return createErrorResponse('An internal error occurred. Please try again later.');
    }
}

export const STATUS_COMMAND = {
    name: 'status',
    description: 'Check your account linking status',
};
