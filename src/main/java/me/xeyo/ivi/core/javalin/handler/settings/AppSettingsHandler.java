package me.xeyo.ivi.core.javalin.handler.settings;

import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import io.javalin.Javalin;
import io.javalin.http.ContentType;
import me.xeyo.ivi.IVIDisplay;
import me.xeyo.ivi.core.javalin.JavalinHandler;
import me.xeyo.ivi.core.error.InternalExceptionTracker;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

public class AppSettingsHandler extends JavalinHandler {

    private static final Map<String, Object> appSettings = new HashMap<>();
    private static final String[] AVAILABLE_THEMES = {
            "dark", "orange"
    };

    private static final String SETTINGS_FILE = "ivi_settings.json";

    private static IVIDisplay rootAppReference;

    public static String getCurrentTheme() {
        return (String) appSettings.getOrDefault("theme", "dark");
    }

    static {
        loadSettingsFromFile();

        if (appSettings.isEmpty()) {
            appSettings.put("theme", "dark");
            appSettings.put("fullscreen", false);
            appSettings.put("notifications", true);
            saveSettingsToFile();
        }
    }

    @Override
    public void addHandler(Javalin javalin, IVIDisplay rootApp) {
        rootAppReference = rootApp;

        javalin.get("/api/app/settings", ctx -> {
            JSONObject response = new JSONObject();
            response.put("success", true);
            response.put("settings", new JSONObject(appSettings));
            response.put("availableThemes", getAvailableThemes());

            ctx.contentType(ContentType.JSON);
            ctx.json(response);
        });

        javalin.get("/api/app/settings/{key}", ctx -> {
            String key = ctx.pathParam("key");
            JSONObject response = new JSONObject();

            if (appSettings.containsKey(key)) {
                response.put("success", true);
                response.put("key", key);
                response.put("value", appSettings.get(key));
            } else {
                response.put("success", false);
                response.put("error", "Setting not found: " + key);
                ctx.status(404);
            }

            ctx.contentType(ContentType.JSON);
            ctx.json(response);
        });

        javalin.put("/api/app/settings/{key}", ctx -> {
            String key = ctx.pathParam("key");
            JSONObject response = new JSONObject();

            try {
                String body = ctx.body();
                JSONObject requestBody = JSONObject.parseObject(body);

                if (!requestBody.containsKey("value")) {
                    response.put("success", false);
                    response.put("error", "Missing 'value' field in request body");
                    ctx.status(400);
                } else {
                    Object value = requestBody.get("value");

                    if (validateSetting(key, value)) {
                        Object oldValue = appSettings.get(key);
                        appSettings.put(key, value);

                        saveSettingsToFile();

                        if ("fullscreen".equals(key)) {
                            updateFullscreenMode((Boolean) value);
                        }

                        response.put("success", true);
                        response.put("key", key);
                        response.put("oldValue", oldValue);
                        response.put("newValue", value);
                        response.put("message", "Setting updated successfully");
                    } else {
                        response.put("success", false);
                        response.put("error", "Invalid value for setting: " + key);
                        ctx.status(400);
                    }
                }
            } catch (Exception e) {
                response.put("success", false);
                response.put("error", "Invalid JSON format: " + e.getMessage());
                ctx.status(400);
                InternalExceptionTracker.handleException(e);
            }

            ctx.contentType(ContentType.JSON);
            ctx.json(response);
        });

        javalin.patch("/api/app/settings/{key}", ctx -> {
            String key = ctx.pathParam("key");
            JSONObject response = new JSONObject();

            if (!appSettings.containsKey(key)) {
                response.put("success", false);
                response.put("error", "Setting not found: " + key);
                ctx.status(404);
                ctx.contentType(ContentType.JSON);
                ctx.json(response);
                return;
            }

            try {
                String body = ctx.body();
                JSONObject requestBody = JSONObject.parseObject(body);

                if (!requestBody.containsKey("value")) {
                    response.put("success", false);
                    response.put("error", "Missing 'value' field in request body");
                    ctx.status(400);
                } else {
                    Object value = requestBody.get("value");

                    if (validateSetting(key, value)) {
                        Object oldValue = appSettings.get(key);
                        appSettings.put(key, value);

                        saveSettingsToFile();

                        if ("fullscreen".equals(key)) {
                            updateFullscreenMode((Boolean) value);
                        }

                        response.put("success", true);
                        response.put("key", key);
                        response.put("oldValue", oldValue);
                        response.put("newValue", value);
                        response.put("message", "Setting updated successfully");
                    } else {
                        response.put("success", false);
                        response.put("error", "Invalid value for setting: " + key);
                        ctx.status(400);
                    }
                }
            } catch (Exception e) {
                response.put("success", false);
                response.put("error", "Invalid JSON format: " + e.getMessage());
                ctx.status(400);
                InternalExceptionTracker.handleException(e);
            }

            ctx.contentType(ContentType.JSON);
            ctx.json(response);
        });

        javalin.get("/api/app/settings/themes", ctx -> {
            JSONObject response = new JSONObject();
            JSONArray themes = getAvailableThemes();

            response.put("success", true);
            response.put("themes", themes);
            response.put("current", appSettings.get("theme"));

            ctx.contentType(ContentType.JSON);
            ctx.json(response);
        });

        javalin.post("/api/app/settings/fullscreen/toggle", ctx -> {
            JSONObject response = new JSONObject();

            try {
                boolean currentFullscreen = (Boolean) appSettings.getOrDefault("fullscreen", false);
                boolean newFullscreen = !currentFullscreen;

                appSettings.put("fullscreen", newFullscreen);
                saveSettingsToFile();

                updateFullscreenMode(newFullscreen);

                response.put("success", true);
                response.put("fullscreen", newFullscreen);
                response.put("message", "Fullscreen mode toggled successfully");
            } catch (Exception e) {
                response.put("success", false);
                response.put("error", "Failed to toggle fullscreen: " + e.getMessage());
                ctx.status(500);
                InternalExceptionTracker.handleException(e);
            }

            ctx.contentType(ContentType.JSON);
            ctx.json(response);
        });
    }

    private JSONArray getAvailableThemes() {
        JSONArray themes = new JSONArray();
        for (String theme : AVAILABLE_THEMES) {
            themes.add(theme);
        }
        return themes;
    }

    private boolean validateSetting(String key, Object value) {
        switch (key) {
            case "theme":
                return value instanceof String &&
                        containsIgnoreCase(AVAILABLE_THEMES, (String) value);
            case "fullscreen":
            case "notifications":
                return value instanceof Boolean;
            default:
                return false;
        }
    }

    private boolean containsIgnoreCase(String[] array, String value) {
        for (String item : array) {
            if (item.equalsIgnoreCase(value)) {
                return true;
            }
        }
        return false;
    }

    private void updateFullscreenMode(boolean fullscreen) {
        if (rootAppReference != null && rootAppReference.getJcefFrame() != null) {
            try {
                javax.swing.SwingUtilities.invokeLater(() -> {
                    try {
                        rootAppReference.getJcefFrame().setFullscreen(fullscreen);
                    } catch (Exception e) {
                        System.err.println("[SETTINGS] Failed to update fullscreen mode: " + e.getMessage());
                        InternalExceptionTracker.handleException(new Exception("Failed to update fullscreen mode", e));
                    }
                });
            } catch (Exception e) {
                System.err.println("[SETTINGS] Error scheduling fullscreen update: " + e.getMessage());
                InternalExceptionTracker.handleException(e);
            }
        }
    }

    private static void saveSettingsToFile() {
        try {
            JSONObject settingsJson = new JSONObject(appSettings);
            Path filePath = Paths.get(SETTINGS_FILE);
            Files.writeString(filePath, settingsJson.toJSONString());
        } catch (IOException e) {
            System.err.println("[SETTINGS] Failed to save settings: " + e.getMessage());
            InternalExceptionTracker.handleException(e);
        }
    }

    private static void loadSettingsFromFile() {
        try {
            Path filePath = Paths.get(SETTINGS_FILE);
            if (Files.exists(filePath)) {
                String content = Files.readString(filePath);
                JSONObject settingsJson = JSONObject.parseObject(content);

                appSettings.clear();
                for (String key : settingsJson.keySet()) {
                    if (isValidSettingKey(key)) {
                        appSettings.put(key, settingsJson.get(key));
                    }
                }

                System.out.println("[SETTINGS] Settings loaded from: " + SETTINGS_FILE);
                System.out.println("[SETTINGS] Current theme: " + appSettings.get("theme"));
            } else {
                System.out.println("[SETTINGS] Settings file not found, using defaults");
            }
        } catch (IOException e) {
            System.err.println("[SETTINGS] Failed to load settings: " + e.getMessage());
            InternalExceptionTracker.handleException(e);
        } catch (Exception e) {
            System.err.println("[SETTINGS] Error parsing settings file: " + e.getMessage());
            InternalExceptionTracker.handleException(e);
        }
    }

    private static boolean isValidSettingKey(String key) {
        return key.equals("theme") || key.equals("fullscreen") || key.equals("notifications");
    }
}