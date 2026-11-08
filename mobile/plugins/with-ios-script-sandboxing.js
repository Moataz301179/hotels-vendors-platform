const { withXcodeProject } = require('@expo/config-plugins');

/**
 * CocoaPods resource scripts generate their temporary input lists inside Pods.
 * Xcode's user-script sandbox blocks that generated path in this project.
 */
module.exports = function withIosScriptSandboxing(config) {
  return withXcodeProject(config, (mod) => {
    const configurations = mod.modResults.pbxXCBuildConfigurationSection();
    for (const configuration of Object.values(configurations)) {
      if (configuration && typeof configuration === 'object' && configuration.buildSettings) {
        configuration.buildSettings.ENABLE_USER_SCRIPT_SANDBOXING = 'NO';
      }
    }
    return mod;
  });
};
