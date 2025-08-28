# Minecraft Plugin Integration Example

This directory contains example code for a Minecraft plugin that integrates with the Discord authentication bot.

## Example Plugin Features

The Minecraft plugin should provide:

1. **Player Join/Leave Events**: Notify the Discord bot when players join/leave
2. **Verification Command**: Allow players to verify their accounts in-game
3. **Status Command**: Let players check their linking status
4. **API Communication**: Handle communication with the Discord bot API

## Required Plugin Commands

### `/discordlink`

Shows information about how to link accounts

### `/verify <code>`

Allows players to verify their account with a code from Discord

### `/discordstatus`

Shows the player's current linking status

## API Integration

The plugin should make HTTP requests to your Vercel deployment:

- **Endpoint**: `https://your-domain.vercel.app/api/minecraft`
- **Authentication**: `Authorization: Bearer <MC_SERVER_API_KEY>`
- **Content-Type**: `application/json`

## Example Integration Flow

1. Player joins server → Plugin notifies Discord bot
2. Player uses `/link` in Discord → Bot sends verification code to Minecraft
3. Player uses `/verify <code>` in Minecraft → Plugin verifies with Discord bot
4. Accounts are now linked!

## Plugin Implementation Notes

For a Bukkit/Spigot plugin, you would:

1. Listen for `PlayerJoinEvent` and `PlayerQuitEvent`
2. Register commands for verification
3. Use HTTP client to communicate with the Discord bot API
4. Store minimal data locally (just UUIDs and verification status)
5. Handle error cases gracefully

## Example Plugin.yml

```yaml
name: DiscordAuth
version: 1.0.0
description: Discord account linking for Minecraft
author: YourName
main: com.yourpackage.DiscordAuthPlugin
api-version: 1.19
depend: []
softdepend: []

commands:
  discordlink:
    description: Get information about linking your Discord account
    usage: /discordlink
    permission: discordauth.link
  verify:
    description: Verify your account with a Discord code
    usage: /verify <code>
    permission: discordauth.verify
  discordstatus:
    description: Check your Discord linking status
    usage: /discordstatus
    permission: discordauth.status

permissions:
  discordauth.*:
    description: All DiscordAuth permissions
    children:
      discordauth.link: true
      discordauth.verify: true
      discordauth.status: true
  discordauth.link:
    description: Access to link command
    default: true
  discordauth.verify:
    description: Access to verify command
    default: true
  discordauth.status:
    description: Access to status command
    default: true
```

This integration allows seamless account linking between Discord and Minecraft accounts.
