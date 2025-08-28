import { VercelRequest, VercelResponse } from '@vercel/node';
import { InteractionType } from 'discord-interactions';
import { verifyDiscordRequest, createErrorResponse } from '../lib/utils';
import { handleLinkCommand } from '../lib/commands/link';
import { handleVerifyCommand } from '../lib/commands/verify';
import { handleStatusCommand } from '../lib/commands/status';
import { handleUnlinkCommand } from '../lib/commands/unlink';
import { handleAdminCommand } from '../lib/commands/admin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify the request is from Discord
        const isValid = await verifyDiscordRequest(req as any);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid request signature' });
        }

        const interaction = req.body;

        // Handle ping (Discord verification)
        if (interaction.type === InteractionType.PING) {
            return res.json({ type: 1 });
        }

        // Handle application commands
        if (interaction.type === InteractionType.APPLICATION_COMMAND) {
            const commandName = interaction.data.name;

            let response: Response;

            switch (commandName) {
                case 'link':
                    response = await handleLinkCommand(interaction);
                    break;
                case 'verify':
                    response = await handleVerifyCommand(interaction);
                    break;
                case 'status':
                    response = await handleStatusCommand(interaction);
                    break;
                case 'unlink':
                    response = await handleUnlinkCommand(interaction);
                    break;
                case 'admin':
                    response = await handleAdminCommand(interaction);
                    break;
                default:
                    response = createErrorResponse(`Unknown command: ${commandName}`);
            }

            const responseData = await response.json();
            return res.json(responseData);
        }

        // Handle component interactions (buttons, etc.)
        if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
            // You can add button handling here if needed
            return res.json({
                type: 4,
                data: {
                    content: 'Component interactions not implemented yet.',
                    flags: 64, // EPHEMERAL
                },
            });
        }

        return res.status(400).json({ error: 'Unknown interaction type' });

    } catch (error) {
        console.error('Error handling Discord interaction:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
