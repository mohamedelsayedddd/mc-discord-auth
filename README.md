# Minecraft Authentication Through Discord

[![CI](https://github.com/clxrityy/mc-discord-auth/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/clxrityy/mc-discord-auth/actions/workflows/ci.yml)

## Overview

This project links Minecraft accounts to Discord accounts for authentication, using a TypeScript Discord bot (Vercel serverless) and a Java Minecraft plugin (Spigot/Paper).

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Usage](#usage)
- [Development](#development)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- [ ] Node.js 18+ and pnpm
- [ ] Java 17 (for Minecraft plugin)
- [ ] Maven (for plugin build)
- [ ] Discord bot application
- [ ] Vercel account
- [ ] Minecraft server (Spigot or Paper)

## Project Structure

- `api/` — Vercel API routes (discord.ts, minecraft.ts)
- `lib/` — Bot logic, database, and command handlers
- `plugin/` — Minecraft plugin (Java, Maven)
- `scripts/` — Command registration scripts
- `prisma/` — Prisma schema and migrations
- `Makefile` — Project automation

## Setup Instructions

### 1. Clone and Install

```zsh
git clone https://github.com/clxrityy/mc-discord-auth.git
cd mc-discord-auth
make install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your Discord, database, and Minecraft server details.

### 3. Database Setup

```zsh
make prisma-generate
make prisma-push
```

### 4. Register Discord Commands

```zsh
make register-commands
```

### 5. Deploy Bot to Vercel

```zsh
make deploy
```

Set your Discord application's Interactions Endpoint URL to:

```
https://<your-vercel-domain>/api/discord
```

### 6. Build the Minecraft Plugin

```zsh
make plugin-build
```

The plugin JAR will be in `plugin/target/DiscordAuth-1.0.0.jar`.

### 7. Configure the Plugin

Edit `plugin/config.yml` with your API URL and API key (should match your Vercel deployment and `.env`):

```yaml
api-url: "https://<your-vercel-domain>/api/minecraft"
api-key: "your_api_key_here"
```

### 8. Install the Plugin

Copy the JAR to your Minecraft server's `plugins/` directory and restart the server.

## Usage

- In Discord, use `/link <username>` to start linking your Minecraft account.
- In Minecraft, join the server and use `/verify <code>` with the code sent to you in-game.
- Use `/discordstatus` in Minecraft to check your link status.
- Use `/status` in Discord to check your link status.
- Use `/unlink` in Discord to remove the link.

## Development

- Use `make help` to see all available automation commands.
- Use `make clean-empty-files` to remove empty files from the repo.
- Use `make plugin-clean` and `make plugin-clean-compile` for plugin builds.

## Testing

- Use `make test` to run all tests.
- Use `make test-plugin` to run plugin tests.

## Troubleshooting

- Ensure your API keys and URLs match between `.env`, Vercel, and `config.yml`.
- Use Java 17 for plugin builds and server runtime.
- Check Vercel and Minecraft server logs for errors.
