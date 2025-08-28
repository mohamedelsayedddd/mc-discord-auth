import { DiscordInteraction, COLORS, EMOJI } from '../types';
import { db } from '../database';
import { minecraftService } from '../minecraft';
import { createErrorResponse, createEmbedResponse, getDiscordUserTag } from '../utils';

export async function handleVerifyCommand(interaction: DiscordInteraction): Promise<Response> {
    const user = interaction.member?.user || interaction.user;
    if (!user) {
        return createErrorResponse('Could not identify user');
    }

    const options = (interaction.data as { options?: any[] })?.options || [];
    const verificationCode = options.find(opt => opt.name === 'code')?.value;

    if (!verificationCode || typeof verificationCode !== 'string') {
        return createErrorResponse('Please provide a valid verification code');
    }

    const code = verificationCode.toUpperCase().trim();

    try {
        // Get verification by code
        const verification = await db.getVerificationByCode(code);
        if (!verification) {
            return createEmbedResponse({
                title: `${EMOJI.ERROR} Invalid Code`,
                description: 'The verification code is invalid or has expired.',
                color: COLORS.ERROR,
                footer: { text: 'Make sure you copied the code correctly' },
            }, true);
        }

        // Check if the verification belongs to this user
        if (verification.userId !== user.id) {
            return createEmbedResponse({
                title: `${EMOJI.ERROR} Wrong User`,
                description: 'This verification code belongs to a different Discord account.',
                color: COLORS.ERROR,
            }, true);
        }

        // Complete the verification
        const updatedUser = await db.completeVerification(code);
        if (!updatedUser) {
            return createEmbedResponse({
                title: `${EMOJI.ERROR} Verification Failed`,
                description: 'Could not complete verification. The code may have expired.',
                color: COLORS.ERROR,
                footer: { text: 'Please start the linking process again with /link' },
            }, true);
        }

        // Notify the player in-game
        const discordTag = getDiscordUserTag(user);
        await minecraftService.notifyVerificationSuccess(
            verification.minecraftName,
            discordTag
        );

        // Log the successful verification
        await db.logAction('verification_completed', updatedUser.id, {
            minecraftUsername: verification.minecraftName,
            minecraftUuid: verification.minecraftUuid,
        });

        return createEmbedResponse({
            title: `${EMOJI.SUCCESS} Account Linked Successfully!`,
            description: `Your Discord account has been successfully linked to Minecraft player **${verification.minecraftName}**.`,
            color: COLORS.SUCCESS,
            fields: [
                {
                    name: 'Discord Account',
                    value: discordTag,
                    inline: true,
                },
                {
                    name: 'Minecraft Account',
                    value: verification.minecraftName,
                    inline: true,
                },
                {
                    name: 'Status',
                    value: `${EMOJI.LINK} Verified`,
                    inline: true,
                },
            ],
            footer: { text: 'You can now access all linked-account features!' },
        }, true);

    } catch (error) {
        console.error('Error in verify command:', error);
        return createErrorResponse('An internal error occurred. Please try again later.');
    }
}

export const VERIFY_COMMAND = {
    name: 'verify',
    description: 'Complete account verification with the code received in-game',
    options: [
        {
            name: 'code',
            description: 'The verification code you received in Minecraft',
            type: 3, // STRING
            required: true,
        },
    ],
};
