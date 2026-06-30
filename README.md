# Flow

Flow is a modern, local-first Android expense tracking app by APEX Studio.

Flow helps users track everyday expenses, organize budgets, keep finance-related notes, and review spending patterns without requiring an account, external server, or cloud database.

## Status

Flow 1.0.0 is the first public release of Flow. The project is actively maintained, and future updates will focus on bug fixes, stability improvements, documentation updates, and carefully tested feature refinements.

## Highlights

* **Expense Tracking**: Track everyday expenses with categories, payment methods, dates, and descriptions.
* **Budget Planning**: Create category-based budgets and monitor spending progress.
* **Finance Notes**: Keep finance-related notes, reminders, and personal context alongside expenses.
* **Graphs & Insights**: Review spending patterns using visual charts and breakdowns.
* **Backup & Restore**: Export and import local app data using user-controlled backup files.
* **Local-First Privacy**: Use the app without a required account, hosted backend, or cloud database.
* **Android Packaging**: Packaged for Android using Capacitor.

## Privacy-First Design

Flow is designed around local-first data ownership.

* No required account.
* No hosted backend database.
* No required cloud synchronization.
* No built-in analytics or remote tracking.
* Personal finance data is stored on the user's device.
* Exported backup files are plain JSON and may contain readable app data.

Users should store exported backup files carefully and avoid sharing them publicly.

## What Flow Does Not Do

Flow does not provide banking integration, investment tracking, tax filing, remote account sync, or financial advice. It is designed for regular personal expense tracking and offline-first money organization.

## Download

The signed Android APK for Flow 1.0.0 is available from the GitHub Releases page.

Download `Flow-v1.0.0.apk` from the release assets and install it on an Android device to start using Flow.

A SHA-256 checksum file, `Flow-v1.0.0.sha256`, is also provided for users who want to verify the APK before installation.

## Tech Stack

* **Framework**: Next.js App Router
* **UI Library**: React
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **Animation**: Framer Motion
* **Native Android Wrapper**: Capacitor Android
* **Storage Model**: Local-first client storage with Android native preferences support

## Development Setup

### Prerequisites

Before working on Flow, install:

* Node.js 20 or later
* npm
* Android Studio
* Android SDK and Gradle build tools

### Install Dependencies

```bash
npm ci
```

### Verify Project

```bash
npm run verify
```

This runs the project verification workflow, including version checks, tests, type checking, linting, and production build validation.

### Run Tests

```bash
npm test
```

### Sync Android Project

```bash
npm run android:sync
```

### Build Android Debug APK

```bash
npm run android:debug
```

For signed release APK generation, use Android Studio and keep signing keys outside the repository.

## Project Structure

```text
.github/     GitHub workflows, issue templates, and pull request template
android/     Capacitor Android project and native Android bridge code
assets/      Brand and source design assets
public/      Static public app assets
scripts/     Project verification and helper scripts
src/         Next.js, React, TypeScript, app features, components, hooks, and utilities
```

Build outputs, dependency folders, local configuration files, and signing materials are intentionally excluded from version control.

## Documentation

* [Contributing Guidelines](CONTRIBUTING.md)
* [Security Policy](SECURITY.md)
* [Privacy Policy](PRIVACY.md)
* [Code of Conduct](CODE_OF_CONDUCT.md)
* [Changelog](CHANGELOG.md)
* [License](LICENSE)

## Security

Please do not report security vulnerabilities through public GitHub issues. Follow the responsible disclosure process described in [SECURITY.md](SECURITY.md).

## Contributing

Contributions are welcome when they preserve Flow's local-first design, privacy boundaries, Android compatibility, and project structure.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening issues or pull requests.

## License

Flow is open-source software licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.

## Developer & Brand

* **Developer**: Subhodeep Rajak
* **Brand**: APEX Studio

APEX Studio is an independent open-source software brand founded by Subhodeep Rajak. It serves as the official home for a next-generation ecosystem of solo-developed applications, tools, and digital projects.

---

© 2026 APEX Studio. Licensed under Apache License 2.0.
