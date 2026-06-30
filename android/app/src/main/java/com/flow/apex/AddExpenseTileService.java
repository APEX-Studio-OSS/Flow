package com.flow.apex;

import android.annotation.SuppressLint;
import android.app.PendingIntent;
import android.content.Intent;
import android.graphics.drawable.Icon;
import android.os.Build;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;

public class AddExpenseTileService extends TileService {

    @SuppressLint("StartActivityAndCollapseDeprecated")
    @Override
    public void onClick() {
        super.onClick();
        
        Intent intent = new Intent(this, MainActivity.class);
        intent.putExtra("flow_action", "add_expense");
        intent.setAction("com.flow.apex.ACTION_ADD_EXPENSE");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                // Android 14+ (API 34+) requires PendingIntent for starting activities from tile services
                PendingIntent pendingIntent = PendingIntent.getActivity(
                    this,
                    0,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                startActivityAndCollapse(pendingIntent);
            } else {
                // Older Android versions support direct Intent launch
                startActivityAndCollapse(intent);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onStartListening() {
        super.onStartListening();
        Tile tile = getQsTile();
        if (tile != null) {
            tile.setState(Tile.STATE_ACTIVE);
            tile.setLabel("Add Expense");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                tile.setIcon(Icon.createWithResource(this, R.drawable.ic_flow_qs_tile));
            }
            tile.updateTile();
        }
    }
}
