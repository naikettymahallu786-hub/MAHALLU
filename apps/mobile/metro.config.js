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
  config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ];
}

module.exports = withNativeWind(config, { input: './global.css' });
