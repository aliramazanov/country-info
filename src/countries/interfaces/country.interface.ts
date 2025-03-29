export interface Country {
  countryCode: string;
  name: string;
}

export interface CountryInfo {
  commonName: string;
  officialName: string;
  countryCode: string;
  region: string;
  borders: Array<{
    commonName: string;
    countryCode: string;
  }>;
}

export interface PopulationCount {
  year: string;
  value: number;
}

export interface PopulationData {
  country: string;
  code: string;
  iso3: string;
  populationCounts: Array<{
    year: number | string;
    value: number;
  }>;
}

export interface PopulationResponse {
  error: boolean;
  msg: string;
  data: PopulationData[];
}

export interface SingleCountryPopulationResponse {
  error: boolean;
  msg: string;
  data: PopulationData;
}

export interface FlagData {
  name: string;
  flag: string;
  iso2: string;
  iso3: string;
}

export interface FlagResponse {
  error: boolean;
  msg: string;
  data: FlagData[];
}

export interface CountryDetails {
  name: string;
  countryCode: string;
  borders: Array<{
    name: string;
    countryCode: string;
  }>;
  population: PopulationCount[];
  flagUrl: string;
}
