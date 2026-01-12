package me.xeyo.ivi;

import java.nio.file.Paths;
import lombok.Getter;
import me.xeyo.ivi.core.error.InternalExceptionTracker;
import me.xeyo.ivi.core.javalin.JavalinInternalServer;
import me.xeyo.ivi.jcef.JCEFFrame;

public class IVIDisplay {

    private static IVIDisplay INSTANCE;

    @Getter
    private final InternalExceptionTracker internalExceptionTracker;

    private JCEFFrame jcefFrame;

    private final JavalinInternalServer javalinInternalServer;

    public IVIDisplay(){
        this.internalExceptionTracker = new InternalExceptionTracker();
        JCEFFrame.initializeCefApp();
        this.javalinInternalServer = new JavalinInternalServer();

        INSTANCE = this;
    }

    public void run() throws Exception {
        this.javalinInternalServer.registerHandlers(this);
        this.javalinInternalServer.start(7070);

        this.jcefFrame = new JCEFFrame("about:blank", false, false);
        this.displayPage("/web/load/loading.html");

        Thread.sleep(1000);

        this.displayPage("/web/home/index.html");

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            this.javalinInternalServer.stop();
            this.jcefFrame.getBrowser().close(true);
            this.jcefFrame.getCefApp().dispose();
        }));

    }

    public void displayPage(final String pagePath){
        final var relativePath = Paths.get("");
        this.jcefFrame.getBrowser().loadURL(relativePath.toAbsolutePath() + pagePath);
    }

    public static IVIDisplay getInstance() {
        return INSTANCE;
    }
}