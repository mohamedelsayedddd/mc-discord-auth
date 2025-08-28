package com.example.discordauth;

import java.util.UUID;

import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.configuration.file.YamlConfiguration;
import org.bukkit.entity.Player;
import org.bukkit.plugin.Plugin;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

// import com.example.discordauth.config.ConfigManager; (not used)

class DiscordAuthHttpTest {
    // Create a subclass that overrides sendJson to capture the payload and return a
    // fake response
    static class TestableHttp extends DiscordAuthHttp {
        public String lastPayload = null;

        public TestableHttp(Plugin plugin) {
            super(plugin);
        }

        @Override
        protected String sendJson(String json) {
            this.lastPayload = json;
            if (json.contains("verify_player")) {
                return "{\"success\":true}";
            }
            if (json.contains("get_player_status")) {
                return "{\"linkedDiscord\":true}";
            }
            return null;
        }
    }

    @Test
    void testDoVerifyAndStatus() {
        FileConfiguration cfg = new YamlConfiguration();
        cfg.set("api-url", "https://example");
        cfg.set("api-key", "key");

        Plugin plugin = mock(Plugin.class);
        when(plugin.getConfig()).thenReturn(cfg);

        TestableHttp http = new TestableHttp(plugin);

        Player p = mock(Player.class);
        when(p.getUniqueId()).thenReturn(UUID.fromString("00000000-0000-0000-0000-000000000001"));
        when(p.getName()).thenReturn("TestPlayer");

        String verifyResp = http.doVerify(p, "ABC123");
        assertEquals("{\"success\":true}", verifyResp);
        assertTrue(http.lastPayload.contains("verify_player"));

        String statusResp = http.doGetPlayerStatus(p);
        assertEquals("{\"linkedDiscord\":true}", statusResp);
        assertTrue(http.lastPayload.contains("get_player_status"));
    }
}
