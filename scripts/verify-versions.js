const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. Read package.json version
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const packageVersion = packageJson.version;

// 2. Read src/constants/app-metadata.ts version
const appMetadataPath = path.join(rootDir, 'src', 'constants', 'app-metadata.ts');
const appMetadataContent = fs.readFileSync(appMetadataPath, 'utf8');
const appMetadataVersionMatch = appMetadataContent.match(/version:\s*['"]([^'"]+)['"]/);
const appMetadataVersion = appMetadataVersionMatch ? appMetadataVersionMatch[1] : null;

// 3. Read android/app/build.gradle versionName
const gradlePath = path.join(rootDir, 'android', 'app', 'build.gradle');
let gradleVersion = null;
if (fs.existsSync(gradlePath)) {
  const gradleContent = fs.readFileSync(gradlePath, 'utf8');
  const gradleVersionMatch = gradleContent.match(/versionName\s+['"]([^'"]+)['"]/);
  gradleVersion = gradleVersionMatch ? gradleVersionMatch[1] : null;
}

console.log('--- Version Synchronization Check ---');
console.log(`package.json version:          ${packageVersion}`);
console.log(`app-metadata.ts version:       ${appMetadataVersion}`);
if (gradleVersion) {
  console.log(`android build.gradle version:  ${gradleVersion}`);
} else {
  console.log('android build.gradle version:  NOT FOUND');
}

let hasError = false;

if (!packageVersion) {
  console.error('ERROR: Could not read version from package.json');
  hasError = true;
}

if (!appMetadataVersion) {
  console.error('ERROR: Could not read version from app-metadata.ts');
  hasError = true;
}

if (packageVersion && appMetadataVersion && packageVersion !== appMetadataVersion) {
  console.error(`ERROR: Version mismatch between package.json (${packageVersion}) and app-metadata.ts (${appMetadataVersion})`);
  hasError = true;
}

if (gradleVersion && packageVersion && gradleVersion !== packageVersion) {
  console.error(`ERROR: Version mismatch between package.json (${packageVersion}) and android build.gradle (${gradleVersion})`);
  hasError = true;
}

if (hasError) {
  console.error('FAILED: Version verification check failed.');
  process.exit(1);
} else {
  console.log('SUCCESS: All version strings are in sync.');
  process.exit(0);
}
