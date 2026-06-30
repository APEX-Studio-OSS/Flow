package com.flow.apex;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import androidx.core.app.NotificationCompat;

public class ExpenseReminderReceiver extends BroadcastReceiver {
    private static final String CHANNEL_ID = "expense_reminders_channel";
    private static final int NOTIFICATION_ID = 1001;

    @Override
    public void onReceive(Context context, Intent intent) {
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager == null) return;

        // Create channel on API 26+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Expense Reminders",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            channel.setDescription("Reminds you to log daily expenses.");
            notificationManager.createNotificationChannel(channel);
        }

        // PendingIntent for clicking notification -> opens MainActivity with add_expense action
        // Using SINGLE_TOP and CLEAR_TOP flags to prevent app restart and duplicate instances
        Intent clickIntent = new Intent(context, MainActivity.class);
        clickIntent.putExtra("flow_action", "add_expense");
        clickIntent.setAction("com.flow.apex.ACTION_ADD_EXPENSE");
        clickIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent clickPendingIntent = PendingIntent.getActivity(
            context,
            0,
            clickIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // PendingIntent for "Add Expense" action button
        Intent actionIntent = new Intent(context, MainActivity.class);
        actionIntent.putExtra("flow_action", "add_expense");
        actionIntent.setAction("com.flow.apex.ACTION_ADD_EXPENSE");
        actionIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent actionPendingIntent = PendingIntent.getActivity(
            context,
            1,
            actionIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Bitmap largeIcon = null;
        try {
            largeIcon = BitmapFactory.decodeResource(context.getResources(), R.mipmap.ic_launcher);
        } catch (Exception ignored) {}

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_flow)
            .setContentTitle("Forgot to add an expense?")
            .setContentText("It's been a while since your last entry. Add your recent spending now.")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(clickPendingIntent)
            .setAutoCancel(true)
            .addAction(R.drawable.ic_flow_qs_tile, "Add Expense", actionPendingIntent);

        if (largeIcon != null) {
            builder.setLargeIcon(largeIcon);
        }

        // Send notification
        notificationManager.notify(NOTIFICATION_ID, builder.build());
    }
}
