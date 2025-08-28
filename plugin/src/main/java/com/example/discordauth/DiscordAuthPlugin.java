package com.example.discordauth;

import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.plugin.java.JavaPlugin;

public class DiscordAuthPlugin extends JavaPlugin implements Listener {
    private DiscordAuthHttp http;

    /**
     * No-arg constructor for MockBukkit
     */
    public DiscordAuthPlugin() {
        super();
    }

    @Override
    public void onEnable() {
        saveDefaultConfig();
        this.http = new DiscordAuthHttp(this);
        getServer().getPluginManager().registerEvents(this, this);
        getLogger().info("DiscordAuth enabled!");
    }

    @Override
    public void onDisable() {
        getLogger().info("DiscordAuth disabled!");
    }

    @EventHandler
    public void onPlayerJoin(PlayerJoinEvent event) {
        Player player = event.getPlayer();
        if (http != null) {
            http.notifyPlayerJoin(player);
        }
    }

    @EventHandler
    public void onPlayerQuit(PlayerQuitEvent event) {
        Player player = event.getPlayer();
        if (http != null) {
            http.notifyPlayerLeave(player);
        }
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player)) {
            if (sender != null) {
                sender.sendMessage("This command can only be used by players.");
            }
            return true;
        }

        Player player = (Player) sender;
        String name = command.getName().toLowerCase();
        switch (name) {
        case "discordlink" -> {
            player.sendMessage(
                    "§b[DiscordAuth] §fTo link your Discord, use /link in Discord and follow the instructions.");
            return true;
        }
        case "verify" -> {
            if (args.length != 1) {
                player.sendMessage("§cUsage: /verify <code>");
                return true;
            }
            if (http != null) {
                http.verifyPlayer(player, args[0]);
            }
            return true;
        }
        case "discordstatus" -> {
            if (http != null) {
                http.getPlayerStatus(player);
            }
            return true;
        }
        default -> {
            return false;
        }
        }
    }
}
