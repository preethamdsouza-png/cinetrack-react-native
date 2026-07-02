const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withCrashlyticsPodfile(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf-8');

      if (!podfile.includes('use_modular_headers!')) {
        podfile = podfile.replace(
          /(prepare_react_native_project!\n)/,
          `$1\nuse_modular_headers!\n`
        );
      }

      if (!podfile.includes('Firebase/Crashlytics')) {
        podfile = podfile.replace(
          /use_expo_modules!/,
          `use_expo_modules!\n\n  pod 'Firebase/Crashlytics'`
        );
      }

      if (!podfile.includes('FirebaseCrashlytics/run')) {
        podfile = podfile.replace(
          /(react_native_post_install\([\s\S]*?\)\n)/,
          `$1\n    installer.pods_project.targets.each do |target|\n      if target.name == '${config.modRequest.projectName || config.name}'\n        phase = target.shell_script_build_phases.find { |phase| phase.name.include?('Crashlytics') }\n        phase.shell_script = "#{File.join(Pod::Config.instance.installation_root, 'Pods/FirebaseCrashlytics/run')} " if phase\n      end\n    end\n`
        );
      }

      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);
};
