export function useCountryFlags() {
  const getFlag = (country) => {
    if (!country || !country.isoAlpha2) {
      return '';
    }
    const isoCode = country.isoAlpha2.toLowerCase();
    return `./flags/${isoCode}.svg`;
  };

  return { getFlag };
}
