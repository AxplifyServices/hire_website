export type B2BCityKey =
  | 'casablanca'
  | 'marrakech'
  | 'tanger'
  | 'rabat'
  | 'fes'
  | 'agadir'
  | 'oujda';

export type B2BCityDefinition = {
  key: B2BCityKey;
  villeApi: string;
  latitude: number;
  longitude: number;
  marker: {
    x: number;
    y: number;
  };
};

export const B2B_ALLOWED_CITIES: B2BCityDefinition[] = [
  {
    key: 'casablanca',
    villeApi: 'Casablanca',
    latitude: 33.5731,
    longitude: -7.5898,
    marker: {x: 180, y: 245}
  },
  {
    key: 'marrakech',
    villeApi: 'Marrakech',
    latitude: 31.6295,
    longitude: -7.9811,
    marker: {x: 195, y: 335}
  },
  {
    key: 'tanger',
    villeApi: 'Tanger',
    latitude: 35.7595,
    longitude: -5.8340,
    marker: {x: 215, y: 95}
  },
  {
    key: 'rabat',
    villeApi: 'Rabat',
    latitude: 34.0209,
    longitude: -6.8416,
    marker: {x: 190, y: 195}
  },
  {
    key: 'fes',
    villeApi: 'Fes',
    latitude: 34.0331,
    longitude: -5.0003,
    marker: {x: 260, y: 190}
  },
  {
    key: 'agadir',
    villeApi: 'Agadir',
    latitude: 30.4278,
    longitude: -9.5981,
    marker: {x: 125, y: 420}
  },
  {
    key: 'oujda',
    villeApi: 'Oujda',
    latitude: 34.6814,
    longitude: -1.9086,
    marker: {x: 350, y: 185}
  }
];

export function normalizeCity(value: string | null | undefined) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function findAgencyForCity<T extends {ville: string | null; id_agence: string}>(
  agencies: T[],
  city: B2BCityDefinition
) {
  const target = normalizeCity(city.villeApi);

  return (
    agencies.find((agency) => normalizeCity(agency.ville) === target) || null
  );
}

export function getB2BCityByKey(key: string | null | undefined) {
  return B2B_ALLOWED_CITIES.find((city) => city.key === key) || null;
}