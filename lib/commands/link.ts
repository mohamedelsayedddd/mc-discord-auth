import { DiscordInteraction, COLORS, EMOJI } from '../types';
import { db } from '../database';
import { minecraftService } from '../minecraft';
import { createErrorResponse, createEmbedResponse, getDiscordUserTag, sanitizeInput } from '../utils';

export async function handleLinkCommand(interaction: DiscordInteraction): Promise<Response> {
    const user = interaction.member?.user || interaction.user;
    if (!user) {
        return createErrorResponse('Could not identify user');
    }

    const options = (interaction.data as { options?: any[] })?.options || [];
    const minecraftUsername = options.find(opt => opt.name === 'username')?.value;

    if (!minecraftUsername || typeof minecraftUsername !== 'string') {
        return createErrorResponse('Please provide a valid Minecraft username');
    }

    const sanitizedUsername = sanitizeInput(minecraftUsername, 16);

    try {
        // Check if user already has a linked account
        const existingUser = await db.getUserByDiscordId(user.id);
        if (existingUser?.isVerified) {
            return createEmbedResponse({
                title: `${EMOJI.WARNING} Already Linked`,
                description: `Your Discord account is already linked to Minecraft player **${existingUser.minecraftName}**`,
                color: COLORS.WARNING,
                footer: { text: 'Use /unlink to remove the current link first' },
            }, true);
        }

        // Get Minecraft player information
        const minecraftPlayer = await minecraftService.getPlayerByUsername(sanitizedUsername);
        if (!minecraftPlayer) {
            return createEmbedResponse({
                title: `${EMOJI.ERROR} Player Not Found`,
                description: `Minecraft player **${sanitizedUsername}** does not exist or has never played Minecraft.`,
                color: COLORS.ERROR,
                footer: { text: 'Please check the spelling and try again' },
            }, true);
        }

        // Check if Minecraft account is already linked
        const existingMinecraftUser = await db.getUserByMinecraftUuid(minecraftPlayer.uuid);
        if (existingMinecraftUser) {
            return createEmbedResponse({
                title: `${EMOJI.ERROR} Already Linked`,
                description: `Minecraft player **${minecraftPlayer.name}** is already linked to another Discord account.`,
                color: COLORS.ERROR,
                footer: { text: 'Each Minecraft account can only be linked to one Discord account' },
            }, true);
        }

        // Check if player is online on the server
        const isOnline = await minecraftService.isPlayerOnline(minecraftPlayer.name);
        if (!isOnline) {
            return createEmbedResponse({
                title: `${EMOJI.WARNING} Player Offline`,
                description: `**${minecraftPlayer.name}** must be online on the Minecraft server to complete verification.`,
                color: COLORS.WARNING,
                fields: [
                    {
                        name: 'Next Steps',
                        value: '1. Join the Minecraft server\n2. Run this command again',
                        inline: false,
                    },
                ],
            }, true);
        }

        // Create or update user record
        const discordTag = getDiscordUserTag(user);
        const dbUser = await db.upsertUser(user.id, discordTag);

        // Create verification request
        const verification = await db.createVerification(
            dbUser.id,
            minecraftPlayer.uuid,
            minecraftPlayer.name
        );

        // Send verification code to player in-game
        const messageSent = await minecraftService.sendVerificationCode(
            minecraftPlayer.name,
            verification.verificationCode
        );

        if (!messageSent) {
            return createEmbedResponse({
                title: `${EMOJI.ERROR} Communication Error`,
                description: 'Could not send verification code to the Minecraft server. Please try again later.',
                color: COLORS.ERROR,
            }, true);
        }

        // Log the action
        await db.logAction('verification_started', dbUser.id, {
            minecraftUsername: minecraftPlayer.name,
            minecraftUuid: minecraftPlayer.uuid,
        });

        return createEmbedResponse({
            title: `${EMOJI.LOADING} Verification Started`,
            description: `A verification code has been sent to **${minecraftPlayer.name}** in-game.`,
            color: COLORS.INFO,
            fields: [
                {
                    name: 'What to do next',
                    value: `1. Check your Minecraft chat for the verification code\n2. Use \`/verify <code>\` here in Discord\n3. Code expires in 30 minutes`,
                    inline: false,
                },
                {
                    name: 'Need help?',
                    value: 'Make sure you are online on the Minecraft server and check your chat.',
                    inline: false,
                },
            ],
            footer: { text: `Verification Code: ${verification.verificationCode}` },
        }, true);

    } catch (error) {
        console.error('Error in link command:', error);
        return createErrorResponse('An internal error occurred. Please try again later.');
    }
}

export const LINK_COMMAND = {
    name: 'link',
    description: 'Link your Discord account with your Minecraft account',
    options: [
        {
            name: 'username',
            description: 'Your Minecraft username',
            type: 3, // STRING
            required: true,
        },
    ],
};
