import { getEnvironmentVariable } from '../lib/utils';
import { LINK_COMMAND } from '../lib/commands/link';
import { VERIFY_COMMAND } from '../lib/commands/verify';
import { STATUS_COMMAND } from '../lib/commands/status';
import { UNLINK_COMMAND } from '../lib/commands/unlink';
import { ADMIN_COMMAND } from '../lib/commands/admin';

const APPLICATION_ID = getEnvironmentVariable('DISCORD_APPLICATION_ID');
const BOT_TOKEN = getEnvironmentVariable('DISCORD_BOT_TOKEN');
const GUILD_ID = process.env.GUILD_ID; // Optional for guild-specific commands

const commands = [
    LINK_COMMAND,
    VERIFY_COMMAND,
    STATUS_COMMAND,
    UNLINK_COMMAND,
    ADMIN_COMMAND,
];

async function registerCommands() {
    try {
        console.log('🔄 Registering Discord application commands...');

        // Determine the URL based on whether we're registering globally or for a specific guild
        const url = GUILD_ID
            ? `https://discord.com/api/v10/applications/${APPLICATION_ID}/guilds/${GUILD_ID}/commands`
            : `https://discord.com/api/v10/applications/${APPLICATION_ID}/commands`;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bot ${BOT_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(commands),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to register commands: ${response.status} ${errorText}`);
        }

        const result = await response.json() as any[];

        console.log('✅ Successfully registered commands:');
        result.forEach((command: any) => {
            console.log(`   - /${command.name}: ${command.description}`);
        });

        if (GUILD_ID) {
            console.log(`📍 Commands registered for guild: ${GUILD_ID}`);
            console.log('ℹ️  Commands will be available immediately in the specified guild.');
        } else {
            console.log('🌍 Commands registered globally');
            console.log('ℹ️  Global commands may take up to 1 hour to propagate.');
        }

    } catch (error) {
        console.error('❌ Error registering commands:', error);
        process.exit(1);
    }
}

async function listCommands() {
    try {
        console.log('📋 Fetching current Discord application commands...');

        const url = GUILD_ID
            ? `https://discord.com/api/v10/applications/${APPLICATION_ID}/guilds/${GUILD_ID}/commands`
            : `https://discord.com/api/v10/applications/${APPLICATION_ID}/commands`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bot ${BOT_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch commands: ${response.status} ${errorText}`);
        }

        const commands = await response.json() as any[];

        if (commands.length === 0) {
            console.log('📭 No commands registered');
            return;
        }

        console.log('📋 Current registered commands:');
        commands.forEach((command: any) => {
            console.log(`   - /${command.name} (ID: ${command.id}): ${command.description}`);
        });

    } catch (error) {
        console.error('❌ Error listing commands:', error);
        process.exit(1);
    }
}

async function deleteAllCommands() {
    try {
        console.log('🗑️  Deleting all Discord application commands...');

        const url = GUILD_ID
            ? `https://discord.com/api/v10/applications/${APPLICATION_ID}/guilds/${GUILD_ID}/commands`
            : `https://discord.com/api/v10/applications/${APPLICATION_ID}/commands`;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bot ${BOT_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([]), // Empty array deletes all commands
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to delete commands: ${response.status} ${errorText}`);
        }

        console.log('✅ All commands deleted successfully');

    } catch (error) {
        console.error('❌ Error deleting commands:', error);
        process.exit(1);
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const action = args[0];

switch (action) {
    case 'register':
    case 'r':
        registerCommands();
        break;
    case 'list':
    case 'l':
        listCommands();
        break;
    case 'delete':
    case 'd':
        deleteAllCommands();
        break;
    default:
        console.log('Usage: npm run register-commands [register|list|delete]');
        console.log('  register (r): Register all commands');
        console.log('  list (l):     List current commands');
        console.log('  delete (d):   Delete all commands');
        process.exit(1);
}
