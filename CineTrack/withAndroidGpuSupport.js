const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidGpuSupport(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application[0];

    // Initialize the uses-native-library array if it doesn't exist
    if (!application['uses-native-library']) {
      application['uses-native-library'] = [];
    }

    // Inject the required Android OpenCL graphics linker bypasses
    application['uses-native-library'].push({
      $: {
        'android:name': 'libvndksupport.so',
        'android:required': 'false'
      }
    });

    application['uses-native-library'].push({
      $: {
        'android:name': 'libOpenCL.so',
        'android:required': 'false'
      }
    });

    return config;
  });
};