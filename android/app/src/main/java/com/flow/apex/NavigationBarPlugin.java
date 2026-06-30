package com.flow.apex;

import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.view.Window;
import android.view.WindowInsetsController;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NavigationBar")
public class NavigationBarPlugin extends Plugin {

    @PluginMethod
    public void setNavigationBarColor(PluginCall call) {
        String colorString = call.getString("color");
        Boolean darkIcons = call.getBoolean("darkIcons", false);

        if (colorString == null) {
            call.reject("Color parameter is missing");
            return;
        }

        getBridge().getActivity().runOnUiThread(() -> {
            try {
                Window window = getBridge().getActivity().getWindow();

                String androidColor = colorString;
                if (colorString.startsWith("#") && colorString.length() == 9) {
                    // Convert CSS format #RRGGBBAA to Android format #AARRGGBB
                    String rrggbb = colorString.substring(1, 7);
                    String aa = colorString.substring(7, 9);
                    androidColor = "#" + aa + rrggbb;
                }

                int color = Color.parseColor(androidColor);
                window.setNavigationBarColor(color);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    window.setNavigationBarContrastEnforced(false);
                }

                // Handle system navigation bar icon styling (dark vs light icons)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    WindowInsetsController controller = window.getInsetsController();
                    if (controller != null) {
                        int flag = WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                        controller.setSystemBarsAppearance(
                            darkIcons ? flag : 0,
                            flag
                        );
                    }
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    View decorView = window.getDecorView();
                    int flags = decorView.getSystemUiVisibility();
                    if (darkIcons) {
                        flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                    } else {
                        flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                    }
                    decorView.setSystemUiVisibility(flags);
                }
                call.resolve();
            } catch (Exception e) {
                call.reject("Error setting navigation bar color: " + e.getMessage());
            }
        });
    }
}
