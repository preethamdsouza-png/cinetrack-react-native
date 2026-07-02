const { withAppBuildGradle, withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withCrashlyticsGradle(config) {
  config = withProjectBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;

    if (!buildGradle.includes('firebase-crashlytics-gradle')) {
      const crashlyticsGradle = "    classpath 'com.google.firebase:firebase-crashlytics-gradle:3.0.2'\n";
      const dependenciesMatch = buildGradle.match(/dependencies\s*\{/);

      if (dependenciesMatch) {
        config.modResults.contents = buildGradle.replace(
          /dependencies\s*\{/,
          `dependencies {\n${crashlyticsGradle}`
        );
      }
    }

    return config;
  });

  config = withAppBuildGradle(config, (config) => {
    const appGradle = config.modResults.contents;

    if (!appGradle.includes('com.google.firebase.crashlytics')) {
      const crashlyticsPlugins = `apply plugin: "com.google.gms.google-services"
apply plugin: "com.google.firebase.crashlytics"
`;
      config.modResults.contents = appGradle.replace(
        /apply plugin: "com.facebook.react"\n/,
        `apply plugin: "com.facebook.react"\n${crashlyticsPlugins}`
      );
    }

    return config;
  });

  return config;
};
