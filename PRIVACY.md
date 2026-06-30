# Privacy Policy

Flow is a local-first Android expense tracking app by APEX Studio.

Flow is designed so personal finance data stays on the user's device. The app does not require an account, hosted backend, cloud database, or remote synchronization service.

## Data Stored by Flow

Flow may store the following app data locally on the user's device:

* Expenses, categories, budgets, and notes.
* Account display name and avatar information.
* Currency, appearance, notification, and app preference settings.
* Backup and restore metadata used by the app.

This data is stored locally for app functionality and is not automatically sent to APEX Studio or any external server.

## Backups

Flow supports user-controlled backup export and import.

Exported backup files are plain JSON files and may contain readable app data, including expenses, budgets, notes, categories, profile details, and preferences.

Users are responsible for storing backup files safely and should avoid sharing them publicly or with untrusted parties.

## Android Permissions and System Access

Flow may use Android permissions or system features for app functionality:

* **Notification Permission**: Used only when local expense reminders are enabled.
* **Boot Completed Permission (`android.permission.RECEIVE_BOOT_COMPLETED`)**: Used to restore local reminder scheduling after a device reboot.
* **File Access / Document Picker**: Used when the user imports or exports backup files.
* **Photo/File Picker Access**: Used only when the user chooses to add or update a profile avatar image.

Permissions are requested only when needed for the related feature.

## Analytics, Tracking, and Remote Services

Flow does not include built-in analytics, advertising tracking, hosted account login, cloud database sync, or remote telemetry in the public 1.0.0 release.

## Data Deletion

Users can delete Flow data from inside the app through available reset, logout, or clear-data flows.

Users may also remove app data by uninstalling Flow or clearing the app's storage from Android system settings.

Exported backup files are stored outside the app when created by the user. Deleting app data does not automatically delete backup files already exported to device storage.

## User Responsibility

Flow is designed for personal expense tracking and offline-first money organization.

Users are responsible for:

* Keeping their device secure.
* Protecting exported backup files.
* Avoiding public sharing of personal finance data.
* Verifying APK files from trusted release sources before installation.

## Changes to This Policy

This privacy policy may be updated when Flow's features, permissions, or data handling behavior changes.

## Contact

Privacy-related questions should be directed through the official APEX Studio GitHub organization or the Flow repository maintainer profile.
