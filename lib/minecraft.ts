import { MinecraftPlayer } from './types';

export class MinecraftService {
    private readonly serverUrl: string;
    private readonly apiKey: string;

    constructor() {
        this.serverUrl = process.env.MC_SERVER_URL || '';
        this.apiKey = process.env.MC_SERVER_API_KEY || '';
    }

    /**
     * Get player information by UUID
     */
    async getPlayerByUUID(uuid: string): Promise<MinecraftPlayer | null> {
        try {
            const response = await fetch(`https://api.mojang.com/user/profile/${uuid.replace(/-/g, '')}`);

            if (!response.ok) {
                return null;
            }

            const data = await response.json() as { id: string; name: string };
            return {
                uuid: this.formatUUID(data.id),
                name: data.name,
                online: false, // We'll check server status separately
            };
        } catch (error) {
            console.error('Error fetching player by UUID:', error);
            return null;
        }
    }

    /**
     * Get player information by username
     */
    async getPlayerByUsername(username: string): Promise<MinecraftPlayer | null> {
        try {
            const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);

            if (!response.ok) {
                return null;
            }

            const data = await response.json() as { id: string; name: string };
            return {
                uuid: this.formatUUID(data.id),
                name: data.name,
                online: false,
            };
        } catch (error) {
            console.error('Error fetching player by username:', error);
            return null;
        }
    }

    /**
     * Check if player is online on the configured server
     */
    async isPlayerOnline(playerName: string): Promise<boolean> {
        if (!this.serverUrl || !this.apiKey) {
            console.warn('Minecraft server configuration not complete');
            return false;
        }

        try {
            // This would depend on your Minecraft server plugin API
            const response = await fetch(`${this.serverUrl}/api/players/${playerName}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                return false;
            }

            const data = await response.json() as { online?: boolean };
            return data.online === true;
        } catch (error) {
            console.error('Error checking player online status:', error);
            return false;
        }
    }

    /**
     * Send a message to a player on the server
     */
    async sendMessageToPlayer(playerName: string, message: string): Promise<boolean> {
        if (!this.serverUrl || !this.apiKey) {
            console.warn('Minecraft server configuration not complete');
            return false;
        }

        try {
            const response = await fetch(`${this.serverUrl}/api/players/${playerName}/message`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            return response.ok;
        } catch (error) {
            console.error('Error sending message to player:', error);
            return false;
        }
    }

    /**
     * Execute a command on the server
     */
    async executeCommand(command: string): Promise<boolean> {
        if (!this.serverUrl || !this.apiKey) {
            console.warn('Minecraft server configuration not complete');
            return false;
        }

        try {
            const response = await fetch(`${this.serverUrl}/api/commands`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ command }),
            });

            return response.ok;
        } catch (error) {
            console.error('Error executing command:', error);
            return false;
        }
    }

    /**
     * Get server status
     */
    async getServerStatus(): Promise<{ online: boolean; players: number; maxPlayers: number }> {
        if (!this.serverUrl) {
            return { online: false, players: 0, maxPlayers: 0 };
        }

        try {
            const response = await fetch(`${this.serverUrl}/api/status`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                return { online: false, players: 0, maxPlayers: 0 };
            }

            const data = await response.json() as { online?: boolean; players?: number; maxPlayers?: number };
            return {
                online: data.online || false,
                players: data.players || 0,
                maxPlayers: data.maxPlayers || 0,
            };
        } catch (error) {
            console.error('Error fetching server status:', error);
            return { online: false, players: 0, maxPlayers: 0 };
        }
    }

    /**
     * Verify that a player with given UUID is online and can receive verification
     */
    async verifyPlayerCanReceiveVerification(uuid: string, playerName: string): Promise<boolean> {
        try {
            // First check if the player exists in Mojang's database
            const player = await this.getPlayerByUUID(uuid);
            if (!player || player.name !== playerName) {
                return false;
            }

            // Check if player is online on our server
            const isOnline = await this.isPlayerOnline(playerName);
            if (!isOnline) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error verifying player:', error);
            return false;
        }
    }

    /**
     * Send verification code to player in-game
     */
    async sendVerificationCode(playerName: string, code: string): Promise<boolean> {
        const message = `§a[Discord Auth] §fYour verification code is: §e${code}§f. Use this code in Discord to complete verification.`;
        return await this.sendMessageToPlayer(playerName, message);
    }

    /**
     * Notify player of successful verification
     */
    async notifyVerificationSuccess(playerName: string, discordTag: string): Promise<boolean> {
        const message = `§a[Discord Auth] §fSuccessfully linked your account with Discord user §b${discordTag}§f!`;
        return await this.sendMessageToPlayer(playerName, message);
    }

    /**
     * Format UUID with dashes
     */
    private formatUUID(uuid: string): string {
        const clean = uuid.replace(/-/g, '');
        return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20, 32)}`;
    }
}

export const minecraftService = new MinecraftService();
