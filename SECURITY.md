# Security Policy

## Supported Versions

| Version | Support Status |
| ------- | -------------- |
| 1.0.x   | Supported      |
| < 1.0.0 | Not supported  |

Flow 1.0.x is the currently supported public release line. Security reports are reviewed and handled on a best-effort basis by the maintainer.

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues.

Use GitHub Private Vulnerability Reporting for this repository when available, or contact the maintainer through the official APEX Studio GitHub organization or maintainer profile.

When reporting a vulnerability, please include:

* A clear description of the issue.
* Steps to reproduce the issue.
* The affected Flow version.
* The affected Android version or device environment, if relevant.
* Any screenshots, logs, or proof-of-concept details that help explain the issue.

Please avoid including real personal finance data, private backup files, signing keys, passwords, or other sensitive information in reports.

## Security Scope

Security reports may include issues related to:

* Local data storage behavior.
* Backup import or export handling.
* Data reset, logout, or onboarding bypasses.
* Android permissions.
* Native Android bridge behavior.
* APK integrity or release asset concerns.
* Exposure of sensitive files, signing materials, or local configuration.

Flow does not currently operate a hosted backend, account system, cloud database, analytics service, or remote synchronization service. Reports about external server compromise, account takeover, or cloud data exposure are not applicable unless such functionality is added in a future release.

## Privacy and Local Data

Flow is designed as a local-first app. Personal finance data is stored on the user's device.

Exported backup files are user-controlled JSON files and may contain readable app data. Users should store backup files privately and avoid sharing them publicly.

## Signing Keys and Release Artifacts

Android signing keys, keystores, signing properties, passwords, local machine configuration files, generated APK files, and generated AAB files must not be committed to the public repository.

Official public APK files should only be distributed through GitHub Releases or another trusted release channel controlled by the maintainer.

## Response Expectations

Security reports are reviewed on a best-effort basis.

The maintainer may:

* Confirm whether the issue is reproducible.
* Request additional details.
* Prepare a fix when appropriate.
* Publish a patch release if needed.
* Credit the reporter when appropriate and requested.

Please allow reasonable time for review before publicly disclosing a vulnerability.
