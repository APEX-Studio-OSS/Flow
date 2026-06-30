package com.flow.apex;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NavigationBarPlugin.class);
        registerPlugin(FlowNativeBridge.class);
        registerPlugin(SystemBarScrimPlugin.class);
        super.onCreate(savedInstanceState);

        // Handle launch action if opened via notification/tile
        handleIntent(getIntent());

        // Disable status bar and navigation bar contrast enforcement to prevent gray overlays
        Window window = getWindow();
        window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS | android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
        window.addFlags(android.view.WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setNavigationBarContrastEnforced(false);
            window.setStatusBarContrastEnforced(false);
        }

        // Force dark-mode system bars matching app background if device is in night mode at startup
        int nightModeFlags = getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK;
        // (Note: original code for handling night mode was omitted in backup)
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent != null) {
            String action = intent.getStringExtra("flow_action");
            if (action == null && intent.getAction() != null) {
                if (intent.getAction().equals("com.flow.apex.ACTION_ADD_EXPENSE")) {
                    action = "add_expense";
                }
            }
            if (action != null) {
                FlowNativeBridge.launchAction = action;
            }
        }
    }
}
