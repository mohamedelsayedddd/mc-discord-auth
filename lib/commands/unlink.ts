import { DiscordInteraction, COLORS, EMOJI } from '../types';
import { db } from '../database';
import { createErrorResponse, createEmbedResponse, getDiscordUserTag } from '../utils';

export async function handleUnlinkCommand(interaction: DiscordInteraction): Promise<Response> {
    const user = interaction.member?.user || interaction.user;
    if (!user) {
        return createErrorResponse('Could not identify user');
    }

    try {
        // Get user from database
        const dbUser = await db.getUserByDiscordId(user.id);
        if (!dbUser || !dbUser.isVerified) {
            return createEmbedResponse({
                title: `${EMOJI.WARNING} Nothing to Unlink`,
                description: 'Your Discord account is not currently linked to any Minecraft account.',
                color: COLORS.WARNING,
                footer: { text: 'Use /link <username> to link your accounts' },
            }, true);
        }

        const minecraftName = dbUser.minecraftName;
        const discordTag = getDiscordUserTag(user);

        // Unlink the accounts by clearing Minecraft info and setting verified to false
        await db.unlinkAccounts(dbUser.id);

        // Log the action
        await db.logAction('accounts_unlinked', dbUser.id, {
            previousMinecraftName: minecraftName,
        });

        return createEmbedResponse({
            title: `${EMOJI.SUCCESS} Accounts Unlinked`,
            description: `Successfully unlinked your Discord account from Minecraft player **${minecraftName}**.`,
            color: COLORS.SUCCESS,
            fields: [
                {
                    name: 'Discord Account',
                    value: discordTag,
                    inline: true,
                },
                {
                    name: 'Previous Minecraft Account',
                    value: minecraftName || 'Unknown',
                    inline: true,
                },
                {
                    name: 'Status',
                    value: `${EMOJI.ERROR} Unlinked`,
                    inline: true,
                },
            ],
            footer: { text: 'You can link to a different Minecraft account using /link <username>' },
        }, true);

    } catch (error) {
        console.error('Error in unlink command:', error);
        return createErrorResponse('An internal error occurred. Please try again later.');
    }
}

export const UNLINK_COMMAND = {
    name: 'unlink',
    description: 'Unlink your Discord account from your Minecraft account',
};
