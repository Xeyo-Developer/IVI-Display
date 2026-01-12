package me.xeyo.ivi.core.javalin;

import io.javalin.Javalin;
import me.xeyo.ivi.IVIDisplay;

public abstract class JavalinHandler {

    public abstract void addHandler(final Javalin javalin, final IVIDisplay rootApp) throws Exception;

}