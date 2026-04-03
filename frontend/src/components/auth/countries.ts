export type CountryOption = {
  code: string;
  dialCode: string;
};

export const COUNTRIES: CountryOption[] = [
  {code: 'MA', dialCode: '+212'},
  {code: 'DZ', dialCode: '+213'},
  {code: 'TN', dialCode: '+216'},
  {code: 'LY', dialCode: '+218'},
  {code: 'EG', dialCode: '+20'},
  {code: 'MR', dialCode: '+222'},
  {code: 'SN', dialCode: '+221'},
  {code: 'CI', dialCode: '+225'},
  {code: 'ML', dialCode: '+223'},
  {code: 'GN', dialCode: '+224'},
  {code: 'CM', dialCode: '+237'},
  {code: 'NG', dialCode: '+234'},
  {code: 'ZA', dialCode: '+27'},
  {code: 'KE', dialCode: '+254'},
  {code: 'ET', dialCode: '+251'},

  {code: 'FR', dialCode: '+33'},
  {code: 'ES', dialCode: '+34'},
  {code: 'GB', dialCode: '+44'},
  {code: 'US', dialCode: '+1'},
  {code: 'CA', dialCode: '+1'},
  {code: 'DE', dialCode: '+49'},
  {code: 'IT', dialCode: '+39'},
  {code: 'BE', dialCode: '+32'},
  {code: 'NL', dialCode: '+31'},
  {code: 'PT', dialCode: '+351'},
  {code: 'CH', dialCode: '+41'},
  {code: 'AT', dialCode: '+43'},
  {code: 'SE', dialCode: '+46'},
  {code: 'NO', dialCode: '+47'},
  {code: 'DK', dialCode: '+45'},
  {code: 'FI', dialCode: '+358'},
  {code: 'IE', dialCode: '+353'},
  {code: 'PL', dialCode: '+48'},
  {code: 'CZ', dialCode: '+420'},
  {code: 'RO', dialCode: '+40'},
  {code: 'HU', dialCode: '+36'},
  {code: 'GR', dialCode: '+30'},
  {code: 'TR', dialCode: '+90'},
  {code: 'UA', dialCode: '+380'},
  {code: 'RU', dialCode: '+7'},

  {code: 'AE', dialCode: '+971'},
  {code: 'SA', dialCode: '+966'},
  {code: 'QA', dialCode: '+974'},
  {code: 'KW', dialCode: '+965'},
  {code: 'BH', dialCode: '+973'},
  {code: 'OM', dialCode: '+968'},
  {code: 'JO', dialCode: '+962'},
  {code: 'LB', dialCode: '+961'},
  {code: 'IQ', dialCode: '+964'},

  {code: 'IN', dialCode: '+91'},
  {code: 'PK', dialCode: '+92'},
  {code: 'BD', dialCode: '+880'},
  {code: 'CN', dialCode: '+86'},
  {code: 'JP', dialCode: '+81'},
  {code: 'KR', dialCode: '+82'},
  {code: 'SG', dialCode: '+65'},
  {code: 'MY', dialCode: '+60'},
  {code: 'TH', dialCode: '+66'},
  {code: 'ID', dialCode: '+62'},
  {code: 'PH', dialCode: '+63'},
  {code: 'VN', dialCode: '+84'},

  {code: 'AU', dialCode: '+61'},
  {code: 'NZ', dialCode: '+64'},

  {code: 'BR', dialCode: '+55'},
  {code: 'AR', dialCode: '+54'},
  {code: 'MX', dialCode: '+52'},
  {code: 'CL', dialCode: '+56'},
  {code: 'CO', dialCode: '+57'},
  {code: 'PE', dialCode: '+51'}
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

export function getCountryByCode(code: string) {
  return COUNTRIES.find((country) => country.code === code) ?? DEFAULT_COUNTRY;
}