package me.xeyo.ivi.boot;

import com.alibaba.fastjson2.JSONObject;
import java.nio.file.Files;
import java.nio.file.Paths;
import me.xeyo.ivi.IVIDisplay;

public class Bootstrap {

    public static void main(String[] args) throws Exception {
        boolean startFullscreen = false;
        try {
            final var settingsFile = Paths.get("ivi_settings.json");
            if (Files.exists(settingsFile)) {
                final String content = Files.readString(settingsFile);
                final JSONObject settingsJson = JSONObject.parseObject(content);

                if (settingsJson.containsKey("fullscreen")) {
                    startFullscreen = settingsJson.getBooleanValue("fullscreen");
                    System.out.println("[BOOT] Fullscreen setting from file: " + startFullscreen);
                }
            }
        } catch (Exception e) {
            System.err.println("[BOOT] Failed to read settings file: " + e.getMessage());
        }

        final var display = new IVIDisplay(startFullscreen);
        display.run();
    }

}