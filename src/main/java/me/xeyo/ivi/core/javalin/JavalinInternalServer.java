package me.xeyo.ivi.core.javalin;

import io.javalin.Javalin;
import io.javalin.http.HttpStatus;
import io.javalin.plugin.bundled.CorsPluginConfig;
import io.javalin.websocket.WsCloseStatus;
import java.util.ArrayList;
import java.util.List;
import me.xeyo.ivi.IVIDisplay;
import me.xeyo.ivi.core.error.InternalExceptionTracker;
import me.xeyo.ivi.core.javalin.handler.error.ErrorRelay;

public class JavalinInternalServer {

    private final Javalin javalin;

    private final List<JavalinHandler> handlers = new ArrayList<>();

    {
        this.handlers.add(new ErrorRelay());
    }

    public JavalinInternalServer(){
        this.javalin = Javalin.create(config -> {
            config.jetty.defaultPort = 7070;
            config.bundledPlugins.enableCors(cors -> cors.addRule(CorsPluginConfig.CorsRule::anyHost));
        });

        this.javalin.exception(Exception.class, (e,ctx) -> {
            InternalExceptionTracker.handleException(e);
            ctx.status(HttpStatus.INTERNAL_SERVER_ERROR);
            InternalExceptionTracker.showErrors();
        });

        this.javalin.wsException(Exception.class, (e,ctx) -> {
            InternalExceptionTracker.handleException(e);
            ctx.closeSession(WsCloseStatus.SERVER_ERROR);
            InternalExceptionTracker.showErrors();
        });
    }

    public void start(final int port){
        this.javalin.start(port);
    }

    public void registerHandlers(final IVIDisplay rootApp){
        this.handlers.forEach(handler -> {
            try {
                handler.addHandler(this.javalin, rootApp);
            }catch(final Exception e){
                InternalExceptionTracker.handleException(e);
            }
        });
    }

    public void stop(){
        this.javalin.stop();
    }

}