package com.flow.apex;

import android.app.Activity;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;

@CapacitorPlugin(
    name = "FlowNativeBridge",
    permissions = {
        @Permission(
            alias = "notifications",
            strings = { "android.permission.POST_NOTIFICATIONS" }
        ),
        @Permission(
            alias = "storage",
            strings = { android.Manifest.permission.WRITE_EXTERNAL_STORAGE }
        )
    }
)
public class FlowNativeBridge extends Plugin {

    public static String launchAction = null;

    @PluginMethod
    public void getLaunchNotificationAction(PluginCall call) {
        JSObject response = new JSObject();
        response.put("action", launchAction);
        launchAction = null; // consume it
        call.resolve(response);
    }

    @PluginMethod
    public void checkNotificationPermission(PluginCall call) {
        JSObject response = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            boolean granted = getPermissionState("notifications") == PermissionState.GRANTED;
            response.put("granted", granted);
        } else {
            response.put("granted", true);
        }
        call.resolve(response);
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (getPermissionState("notifications") != PermissionState.GRANTED) {
                requestPermissionForAlias("notifications", call, "notificationPermissionCallback");
                return;
            }
        }
        JSObject response = new JSObject();
        response.put("granted", true);
        call.resolve(response);
    }

    @PermissionCallback
    private void notificationPermissionCallback(PluginCall call) {
        JSObject response = new JSObject();
        boolean granted = getPermissionState("notifications") == PermissionState.GRANTED;
        response.put("granted", granted);
        call.resolve(response);
    }

    @PluginMethod
    public void scheduleExpenseReminder(PluginCall call) {
        Integer delayHours = call.getInt("delayHours", 6);
        Integer delaySeconds = call.getInt("delaySeconds");
        Integer delayMinutes = call.getInt("delayMinutes");

        try {
            Context context = getContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) {
                call.reject("AlarmManager not available");
                return;
            }

            Intent intent = new Intent(context, ExpenseReminderReceiver.class);
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            long triggerTime;
            if (delaySeconds != null) {
                triggerTime = System.currentTimeMillis() + (delaySeconds * 1000L);
            } else if (delayMinutes != null) {
                triggerTime = System.currentTimeMillis() + (delayMinutes * 60 * 1000L);
            } else {
                triggerTime = System.currentTimeMillis() + (delayHours * 60 * 60 * 1000L);
            }

            // Standard inexact wake-up alarm is battery-friendly and does not require SCHEDULE_EXACT_ALARM permission
            alarmManager.set(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);

            JSObject response = new JSObject();
            response.put("success", true);
            response.put("triggerTime", triggerTime);
            call.resolve(response);
        } catch (Exception e) {
            call.reject("Failed to schedule reminder: " + e.getMessage());
        }
    }

    @PluginMethod
    public void cancelExpenseReminder(PluginCall call) {
        try {
            Context context = getContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager != null) {
                Intent intent = new Intent(context, ExpenseReminderReceiver.class);
                PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context,
                    0,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                alarmManager.cancel(pendingIntent);
                pendingIntent.cancel();
            }
            JSObject response = new JSObject();
            response.put("success", true);
            call.resolve(response);
        } catch (Exception e) {
            call.reject("Failed to cancel reminder: " + e.getMessage());
        }
    }

    // ==========================================
    // BACKUP IMPORT / EXPORT SYSTEM METHODS
    // ==========================================

    @PluginMethod
    public void exportBackup(PluginCall call) {
        String fileName = call.getString("fileName");
        String json = call.getString("json");

        if (fileName == null || json == null) {
            call.reject("fileName and json content are required");
            return;
        }

        // On older Android versions (API <= 28), we must check & request write storage permission
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
            if (getPermissionState("storage") != PermissionState.GRANTED) {
                requestPermissionForAlias("storage", call, "storagePermissionCallback");
                return;
            }
        }

        performExport(call, fileName, json);
    }

    @PermissionCallback
    private void storagePermissionCallback(PluginCall call) {
        if (getPermissionState("storage") == PermissionState.GRANTED) {
            String fileName = call.getString("fileName");
            String json = call.getString("json");
            performExport(call, fileName, json);
        } else {
            call.reject("Storage write permission is required on this device to export backup");
        }
    }

    private void performExport(PluginCall call, String fileName, String json) {
        try {
            String folderName = "Flow Backup";
            String finalFileName = fileName;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentResolver resolver = getContext().getContentResolver();
                String relativePath = Environment.DIRECTORY_DOWNLOADS + "/" + folderName + "/";
                
                // Get a unique filename to prevent overwriting existing backups
                finalFileName = getUniqueFileNameMediaStore(resolver, finalFileName, relativePath);

                ContentValues contentValues = new ContentValues();
                contentValues.put(MediaStore.Downloads.DISPLAY_NAME, finalFileName);
                contentValues.put(MediaStore.Downloads.MIME_TYPE, "application/json");
                contentValues.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/" + folderName);
                contentValues.put(MediaStore.Downloads.IS_PENDING, 1);

                Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues);
                if (uri == null) {
                    call.reject("Failed to create backup file entry in Downloads");
                    return;
                }

                try (OutputStream os = resolver.openOutputStream(uri)) {
                    if (os == null) {
                        call.reject("Failed to open output stream for backup file");
                        return;
                    }
                    os.write(json.getBytes("UTF-8"));
                }

                contentValues.clear();
                contentValues.put(MediaStore.Downloads.IS_PENDING, 0);
                resolver.update(uri, contentValues, null, null);

                JSObject response = new JSObject();
                response.put("success", true);
                response.put("finalFilePath", "Downloads/" + folderName + "/" + finalFileName);
                response.put("fileName", finalFileName);
                response.put("folder", "Downloads/" + folderName);
                call.resolve(response);

            } else {
                // Legacy devices (Android 9 and below)
                File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                File backupDir = new File(downloadsDir, folderName);
                if (!backupDir.exists()) {
                    if (!backupDir.mkdirs()) {
                        call.reject("Failed to create Flow Backup folder");
                        return;
                    }
                }

                File finalFile = getUniqueFileStandard(backupDir, finalFileName);
                try (FileOutputStream fos = new FileOutputStream(finalFile)) {
                    fos.write(json.getBytes("UTF-8"));
                }

                JSObject response = new JSObject();
                response.put("success", true);
                response.put("finalFilePath", "Downloads/" + folderName + "/" + finalFile.getName());
                response.put("fileName", finalFile.getName());
                response.put("folder", "Downloads/" + folderName);
                call.resolve(response);
            }
        } catch (Exception e) {
            call.reject("Failed to export backup: " + e.getMessage());
        }
    }

    @PluginMethod
    public void importBackup(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        
        String[] extraMimeTypes = {"application/json", "text/json", "application/octet-stream"};
        intent.putExtra(Intent.EXTRA_MIME_TYPES, extraMimeTypes);

        startActivityForResult(call, intent, "importBackupResult");
    }

    @SuppressWarnings("WrongConstant")
    @ActivityCallback
    private void importBackupResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        if (result.getResultCode() == Activity.RESULT_CANCELED) {
            JSObject response = new JSObject();
            response.put("cancelled", true);
            call.resolve(response);
            return;
        }

        Intent data = result.getData();
        if (data == null || data.getData() == null) {
            call.reject("No backup file selected");
            return;
        }

        Uri uri = data.getData();
        
        // Take persistable permissions if available
        try {
            final int takeFlags = data.getFlags()
                & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            getContext().getContentResolver().takePersistableUriPermission(uri, takeFlags);
        } catch (Exception ignored) {
        }

        String displayName = "backup.json";
        Cursor cursor = getContext().getContentResolver().query(uri, null, null, null, null);
        if (cursor != null) {
            try {
                if (cursor.moveToFirst()) {
                    int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    if (nameIndex != -1) {
                        displayName = cursor.getString(nameIndex);
                    }
                }
            } finally {
                cursor.close();
            }
        }

        try {
            InputStream inputStream = getContext().getContentResolver().openInputStream(uri);
            if (inputStream == null) {
                call.reject("Could not open file stream for the selected file");
                return;
            }

            BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, "UTF-8"));
            StringBuilder stringBuilder = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                stringBuilder.append(line).append("\n");
            }
            reader.close();
            inputStream.close();

            JSObject response = new JSObject();
            response.put("cancelled", false);
            response.put("content", stringBuilder.toString());
            response.put("fileName", displayName);
            call.resolve(response);
        } catch (Exception e) {
            call.reject("Failed to read backup file: " + e.getMessage());
        }
    }

    private File getUniqueFileStandard(File dir, String fileName) {
        File file = new File(dir, fileName);
        if (!file.exists()) {
            return file;
        }

        String baseName = fileName;
        String extension = "";
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex != -1) {
            baseName = fileName.substring(0, dotIndex);
            extension = fileName.substring(dotIndex);
        }

        int count = 1;
        while (true) {
            String newName = String.format("%s_%02d%s", baseName, count, extension);
            File newFile = new File(dir, newName);
            if (!newFile.exists()) {
                return newFile;
            }
            count++;
        }
    }

    private String getUniqueFileNameMediaStore(ContentResolver resolver, String fileName, String relativePath) {
        String baseName = fileName;
        String extension = "";
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex != -1) {
            baseName = fileName.substring(0, dotIndex);
            extension = fileName.substring(dotIndex);
        }

        String currentName = fileName;
        int count = 0;

        while (true) {
            Uri queryUri = MediaStore.Downloads.EXTERNAL_CONTENT_URI;
            String[] projection = new String[] { MediaStore.Downloads._ID };
            String selection = MediaStore.Downloads.DISPLAY_NAME + " = ? AND (" 
                + MediaStore.Downloads.RELATIVE_PATH + " = ? OR " 
                + MediaStore.Downloads.RELATIVE_PATH + " = ?)";
            String[] selectionArgs = new String[] { currentName, relativePath, relativePath.substring(0, relativePath.length() - 1) };

            Cursor cursor = null;
            try {
                cursor = resolver.query(queryUri, projection, selection, selectionArgs, null);
                if (cursor == null || cursor.getCount() == 0) {
                    return currentName;
                }
            } catch (Exception e) {
                return currentName;
            } finally {
                if (cursor != null) {
                    cursor.close();
                }
            }

            count++;
            currentName = String.format("%s_%02d%s", baseName, count, extension);
        }
    }
}
