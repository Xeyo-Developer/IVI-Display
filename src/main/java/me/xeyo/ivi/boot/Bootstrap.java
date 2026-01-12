package me.xeyo.ivi.boot;

import me.xeyo.ivi.IVIDisplay;

public class Bootstrap {

    public static void main(String[] args) throws Exception{
        final var display = new IVIDisplay();
        display.run();
    }

}