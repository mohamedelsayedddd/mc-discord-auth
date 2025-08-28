package com.example.discordauth;

import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.configuration.file.YamlConfiguration;
import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

import com.example.discordauth.config.ConfigManager;

class ConfigManagerDefaultsTest {
    @Test
    void testDefaultsWhenMissing() {
        FileConfiguration config = new YamlConfiguration();
        ConfigManager manager = new ConfigManager(config);

        // Defaults are defined in ConfigManager
        assertEquals("https://your-vercel-domain.vercel.app/api/minecraft", manager.getApiUrl());
        assertEquals("changeme", manager.getApiKey());
    }
}
