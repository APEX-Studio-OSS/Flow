package com.flow.apex;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        Log.i(TAG, "Received broadcast action: " + action);

        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            try {
                SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
                String enabledStr = prefs.getString("flow.flow-expense-reminders-enabled", "false");
                
                if ("true".equals(enabledStr)) {
                    Log.i(TAG, "Expense reminders are enabled. Rescheduling alarm.");
                    AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
                    if (alarmManager == null) {
                        Log.e(TAG, "AlarmManager not available");
                        return;
                    }

                    Intent alarmIntent = new Intent(context, ExpenseReminderReceiver.class);
                    PendingIntent pendingIntent = PendingIntent.getBroadcast(
                        context,
                        0,
                        alarmIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                    );

                    // Read last expense added timestamp, fallback to current time
                    String lastAddedStr = prefs.getString("flow.flow-last-expense-added-at", null);
                    long lastAdded = System.currentTimeMillis();
                    if (lastAddedStr != null) {
                        try {
                            lastAdded = Long.parseLong(lastAddedStr);
                        } catch (Exception ignored) {}
                    }

                    long elapsedMs = System.currentTimeMillis() - lastAdded;
                    long delayMs = (6 * 60 * 60 * 1000L) - elapsedMs;
                    long triggerTime = System.currentTimeMillis() + (delayMs > 0 ? delayMs : 6 * 60 * 60 * 1000L);

                    alarmManager.set(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
                    Log.i(TAG, "Rescheduled alarm trigger in " + ((triggerTime - System.currentTimeMillis()) / 1000) + " seconds");
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to reschedule reminders on boot: " + e.getMessage());
            }
        }
    }
}
