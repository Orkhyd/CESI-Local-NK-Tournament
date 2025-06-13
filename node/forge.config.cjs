const config = {
  packagerConfig: {
    asar: true,
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
    // Remove the fuses plugin for now to get it working
  ],
};

module.exports = config;
