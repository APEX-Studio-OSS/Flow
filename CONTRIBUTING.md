# Contributing to Flow

Thank you for your interest in contributing to Flow.

Flow is a local-first Android expense tracking app by APEX Studio. Contributions should preserve the app's privacy-first design, Android compatibility, project structure, and user-focused experience.

## Project Scope

Flow is focused on regular personal expense tracking and offline-first money organization.

Contributions should stay aligned with the current product direction:

* Local-first expense tracking.
* Budget planning.
* Finance notes.
* Graph and insight views.
* Backup and restore flows.
* Android app packaging through Capacitor.
* Privacy-focused, account-free app behavior.

Flow does not currently include banking integration, investment tracking, tax filing, hosted account sync, cloud database sync, or financial advice.

## Before Contributing

Before opening an issue or pull request:

* Check existing issues and pull requests.
* Keep changes focused and easy to review.
* Avoid unrelated refactors.
* Avoid adding large dependencies without a strong reason.
* Preserve the existing app architecture, styling approach, and Android workflow.

## Development Setup

### Prerequisites

Install:

* Node.js 20 or later.
* npm.
* Android Studio.
* Android SDK and Gradle build tools.

### Install Dependencies

```bash
npm ci
```

### Verify the Project

```bash
npm run verify
```

The verification workflow checks version alignment, tests, TypeScript, linting, and production build readiness.

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

Official signed release builds are created and published only by the maintainer. Do not commit signing keys, keystores, signing properties, APK files, AAB files, generated Android release outputs, or local machine configuration files.

## Issue Guidelines

Use the repository issue templates when opening issues.

Good issue reports should include:

* A clear title.
* Steps to reproduce the problem.
* Expected behavior.
* Actual behavior.
* Flow version.
* Android version and device details, when relevant.
* Screenshots or screen recordings, when helpful.

Please do not include personal finance data, private backup files, signing keys, passwords, or other sensitive information in issues.

Security vulnerabilities should not be reported through public issues. Follow the process in [SECURITY.md](SECURITY.md).

## Pull Request Guidelines

Pull requests should be focused, tested, and easy to review.

Before opening a pull request:

* Make sure the change matches Flow's scope.
* Run `npm run verify`.
* Confirm there are no generated files or private files included.
* Update documentation when behavior changes.
* Keep UI changes consistent with the existing mobile-first design.
* Keep Android and Capacitor behavior stable.

Pull requests should include:

* A clear summary of the change.
* The reason for the change.
* Screenshots or recordings for UI changes.
* Notes about testing performed.
* Any limitations or follow-up work.

## Code and UI Guidelines

Flow uses:

* Next.js App Router.
* React.
* TypeScript.
* Tailwind CSS.
* Framer Motion.
* Capacitor Android.

Contributions should:

* Use existing project patterns.
* Prefer small, readable changes.
* Keep TypeScript types clear.
* Avoid unnecessary global state.
* Avoid disconnected UI systems.
* Preserve mobile-first spacing, touch behavior, and Android back-button expectations.
* Preserve local-first storage and backup behavior.

## Privacy and Security Expectations

Contributions must not introduce:

* Required accounts.
* Hosted backend dependency.
* Cloud database sync.
* Built-in analytics or remote tracking.
* Unnecessary permissions.
* Exposure of local finance data.
* Public storage of signing materials or secrets.

Any change that affects data storage, backups, permissions, security, or privacy must be documented clearly.

## Documentation

Update relevant documentation when needed:

* [README.md](README.md)
* [CHANGELOG.md](CHANGELOG.md)
* [PRIVACY.md](PRIVACY.md)
* [SECURITY.md](SECURITY.md)

## Code of Conduct

All contributors are expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing to Flow, you agree that your contributions will be licensed under the Apache License 2.0.
