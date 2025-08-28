package com.example.discordauth.config;

import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.plugin.Plugin;

public class ConfigManager {
    private final FileConfiguration config;

    public ConfigManager(Plugin plugin) {
        this.config = plugin.getConfig();
    }

    // Test-friendly constructor
    public ConfigManager(org.bukkit.configuration.file.FileConfiguration config) {
        this.config = config;
    }

    public String getApiUrl() {
        return config.getString("api-url", "https://your-vercel-domain.vercel.app/api/minecraft");
    }

    public String getApiKey() {
        return config.getString("api-key", "changeme");
    }
}
