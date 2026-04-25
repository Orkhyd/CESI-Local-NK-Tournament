export function useCountryFlags() {
  const getFlag = (country) => {
    if (!country || !country.isoAlpha2) {
      return '';
    }
    const isoCode = country.isoAlpha2.toLowerCase();

    // En production Electron, construire le chemin absolu via file://
    const info = window.electron?.appInfo;
    if (info && !info.isDev && info.resourcesPath) {
      return `file://${info.resourcesPath}/dist/flags/${isoCode}.svg`;
    }

    return `./flags/${isoCode}.svg`;
  };

  return { getFlag };
}
