const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;

// Safely resolve monorepo root without breaking on EAS Build runner container
let workspaceRoot = path.resolve(projectRoot, '../..');
if (!fs.existsSync(path.join(workspaceRoot, 'package.json'))) {
  workspaceRoot = path.resolve(projectRoot, '..');
}
if (!fs.existsSync(path.join(workspaceRoot, 'package.json'))) {
  workspaceRoot = projectRoot;
}

const config = getDefaultConfig(projectRoot);

if (workspaceRoot !== projectRoot && fs.existsSync(workspaceRoot)) {
  config.watchFolders = [workspaceRoot];
}

// Map shared packages directly to apps/mobile/packages for EAS Cloud builds
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@mahallu/shared-types': path.resolve(projectRoot, 'packages/shared-types/src/index.ts'),
  '@mahallu/shared-config': path.resolve(projectRoot, 'packages/shared-config/src/index.ts'),
};

module.exports = withNativeWind(config, { input: './global.css' });
