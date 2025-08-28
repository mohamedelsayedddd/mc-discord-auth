package com.example.discordauth.config;

import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.configuration.file.YamlConfiguration;
import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

class ConfigManagerTest {
    @Test
    void testGetApiUrlAndKey() {
        FileConfiguration config = new YamlConfiguration();
        config.set("api-url", "https://test/api");
        config.set("api-key", "testkey");

        com.example.discordauth.config.ConfigManager configManager = new com.example.discordauth.config.ConfigManager(
                config);

        assertEquals("https://test/api", configManager.getApiUrl());
        assertEquals("testkey", configManager.getApiKey());
    }
}
