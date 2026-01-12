package me.xeyo.ivi.core.error;

import java.util.HashMap;
import lombok.Getter;
import me.xeyo.ivi.IVIDisplay;

public class InternalExceptionTracker {

    @Getter
    private static final HashMap<Long, Throwable> throwableHashMap = new HashMap<>();

    public static void showErrors(){
        IVIDisplay.getInstance().displayPage("/web/error/errorPage.html");
    }

    public static void handleException(final Exception exception){
        System.err.println("Exception handled -> " + exception.getMessage());
        exception.printStackTrace();
        throwableHashMap.put(System.currentTimeMillis(),exception);
    }

}