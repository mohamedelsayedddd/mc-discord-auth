package com.example.discordauth;

import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.logging.Level;

import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.plugin.Plugin;

import com.example.discordauth.config.ConfigManager;

public class DiscordAuthHttp {
    private final Plugin plugin;
    private final ConfigManager configManager;
    private final String apiUrl;
    private final String apiKey;

    public DiscordAuthHttp(Plugin plugin) {
        this.plugin = plugin;
        this.configManager = new ConfigManager(plugin);
        this.apiUrl = configManager.getApiUrl();
        this.apiKey = configManager.getApiKey();
    }

    public void notifyPlayerJoin(Player player) {
        Bukkit.getScheduler()
                .runTaskAsynchronously(plugin,
                        () -> sendJson("{\"action\":\"player_join\",\"playerUuid\":\"" + player.getUniqueId()
                                + "\",\"playerName\":\""
                                + player.getName() + "\"}"));
    }

    public void notifyPlayerLeave(Player player) {
        Bukkit.getScheduler()
                .runTaskAsynchronously(plugin,
                        () -> sendJson("{\"action\":\"player_leave\",\"playerUuid\":\"" + player.getUniqueId()
                                + "\",\"playerName\":\""
                                + player.getName() + "\"}"));
    }

    public void verifyPlayer(Player player, String code) {
        Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
            String json = String.format(
                    "{\"action\":\"verify_player\",\"playerUuid\":\"%s\",\"playerName\":\"%s\",\"data\":{\"verificationCode\":\"%s\"}}",
                    player.getUniqueId(), player.getName(), code);
            String response = sendJson(json);
            if (response != null && response.contains("\"success\":true")) {
                player.sendMessage("§a[DiscordAuth] Account linked! You can now use Discord features.");
            } else {
                player.sendMessage("§c[DiscordAuth] Verification failed. Check your code and try again.");
            }
        });
    }

    public void getPlayerStatus(Player player) {
        Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
            String json = String.format("{\"action\":\"get_player_status\",\"playerUuid\":\"%s\"}",
                    player.getUniqueId());
            String response = sendJson(json);
            if (response != null && response.contains("\"linkedDiscord\":true")) {
                player.sendMessage("§a[DiscordAuth] Your Discord is linked!");
            } else {
                player.sendMessage("§e[DiscordAuth] Your Discord is not linked. Use /link in Discord to start.");
            }
        });
    }

    private String sendJson(String json) {
        try {
            URL url = java.net.URI.create(apiUrl).toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + apiKey);
            conn.setDoOutput(true);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(json.getBytes(StandardCharsets.UTF_8));
            }
            int code = conn.getResponseCode();
            if (code == 200) {
                return new String(conn.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (IOException e) {
            plugin.getLogger().log(Level.WARNING, "[DiscordAuth] HTTP error: {0}", e.getMessage());
        }
        return null;
    }
}
