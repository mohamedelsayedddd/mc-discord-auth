package com.example.discordauth;

import org.bukkit.entity.Player;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class DiscordAuthPluginCommandsTest {
    @Test
    void testDiscordLinkCommandSendsMessage() {
        Player player = mock(Player.class);
        boolean handled = DiscordAuthPlugin.handleCommand(player, "discordlink", new String[] {}, null);

        // Player should receive a message suggesting how to link
        verify(player).sendMessage(org.mockito.ArgumentMatchers.contains("To link your Discord"));
        org.junit.jupiter.api.Assertions.assertTrue(handled);
    }

    @Test
    void testVerifyCommandUsageMessage() {
        Player player = mock(Player.class);
        boolean handled = DiscordAuthPlugin.handleCommand(player, "verify", new String[] {}, null);

        verify(player).sendMessage(org.mockito.ArgumentMatchers.contains("Usage: /verify"));
        org.junit.jupiter.api.Assertions.assertTrue(handled);
    }

    @Test
    void testDiscordStatusCommandInvokes() {
        Player player = mock(Player.class);
        boolean handled = DiscordAuthPlugin.handleCommand(player, "discordstatus", new String[] {}, null);

        org.junit.jupiter.api.Assertions.assertTrue(handled);
        // No direct message required (async behavior), just ensure handler returns true
    }
}
