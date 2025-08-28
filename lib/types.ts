import {
    InteractionType,
    InteractionResponseType
} from 'discord-interactions';

export enum ButtonStyle {
    Primary = 1,
    Secondary = 2,
    Success = 3,
    Danger = 4,
    Link = 5,
}

export enum ComponentType {
    ActionRow = 1,
    Button = 2,
    SelectMenu = 3,
    TextInput = 4,
}

export interface DiscordInteraction {
    user: DiscordUser | undefined;
    id: string;
    type: InteractionType;
    data?: {
        data?: {
            id: string;
            name: string;
            type: number;
            options?: any[];
            custom_id?: string;
            component_type?: ComponentType;
        };
        channel_id?: string;
        member?: {
            user: DiscordUser;
            roles: string[];
        };
        user?: DiscordUser;
        token: string;
        version: number;
    }
    member?: {
        user?: DiscordUser;
        roles?: string[];
    };
}

export interface DiscordUser {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
    bot?: boolean;
}

export interface DiscordResponse {
    type: InteractionResponseType;
    data?: {
        content?: string;
        embeds?: DiscordEmbed[];
        components?: DiscordComponent[];
        flags?: number;
    };
}

export interface DiscordEmbed {
    title?: string;
    description?: string;
    color?: number;
    fields?: {
        name: string;
        value: string;
        inline?: boolean;
    }[];
    footer?: {
        text: string;
    };
    timestamp?: string;
}

export interface DiscordComponent {
    type: ComponentType;
    components: {
        type: ComponentType;
        style?: ButtonStyle;
        label?: string;
        custom_id?: string;
        url?: string;
        disabled?: boolean;
    }[];
}

export interface MinecraftPlayer {
    uuid: string;
    name: string;
    online: boolean;
    lastSeen?: Date;
}

export interface AuthTokenData {
    token: string;
    userId: string;
    expiresAt: Date;
    isUsed: boolean;
}

export interface VerificationData {
    code: string;
    discordId: string;
    minecraftUuid: string;
    minecraftName: string;
    expiresAt: Date;
    status: 'pending' | 'completed' | 'expired';
}

export const COLORS = {
    SUCCESS: 0x00ff00,
    ERROR: 0xff0000,
    WARNING: 0xffff00,
    INFO: 0x0099ff,
    PURPLE: 0x9932cc,
} as const;

export const EMOJI = {
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
    INFO: 'ℹ️',
    LOADING: '⏳',
    MINECRAFT: '🧊',
    DISCORD: '💬',
    LINK: '🔗',
} as const;
