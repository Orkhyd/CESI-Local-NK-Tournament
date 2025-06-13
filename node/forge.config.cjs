const { FusesPlugin } = require('@electron-forge/plugin-fuses');

const config = {
  packagerConfig: {
    asar: true,
    // Combine both resources into a single extraResource array
    extraResource: [
      './dist',
      {
        from: './src/preload.js',
        to: 'preload.js'
      }
    ]
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    {
      name: '@electron-forge/plugin-fuses',
      config: {
        version: FusesPlugin.FUSES_VERSION,
        [FusesPlugin.FUSES.runAsNode]: false,
        [FusesPlugin.FUSES.enableCookieEncryption]: true,
        [FusesPlugin.FUSES.enableNodeOptionsEnvironmentVariable]: false,
        [FusesPlugin.FUSES.enableNodeCliInspectArguments]: false,
        [FusesPlugin.FUSES.enableEmbeddedAsarIntegrityValidation]: true,
        [FusesPlugin.FUSES.onlyLoadAppFromAsar]: true,
      },
    },
  ],
};

module.exports = config;
