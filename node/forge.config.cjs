const config = {
  packagerConfig: {
    asar: true,
    extraResource: [
      './dist',
    ],
    executableName: 'nippon-kempo-tournament',
    appBundleId: 'com.orkhyd.nippon-kempo-tournament',
    appCategoryType: 'public.app-category.sports',
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'nippon-kempo-tournament',
        setupExe: 'Nippon-Kempo-Tournament-Setup.installer.exe',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Christophe, Florian, Marius et Pierre',
          homepage: 'https://github.com/Orkhyd/CESI-Local-NK-Tournament',
          description: 'Nippon Kempo Tournament Management Application',
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          maintainer: 'Christophe, Florian, Marius et Pierre',
          homepage: 'https://github.com/Orkhyd/CESI-Local-NK-Tournament',
          description: 'Nippon Kempo Tournament Management Application',
        },
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'Orkhyd',
          name: 'CESI-Local-NK-Tournament',
        },
        prerelease: false,
        generateReleaseNotes: true,
        draft: false,
      },
    },
  ],
};

module.exports = config;
