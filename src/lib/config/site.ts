/** Project identity and contact details, shared by the UI, metadata and outgoing API requests. */
export const SITE = {
  name: 'MedellínBot Salud',
  author: 'Diego Álvarez',
  email: 'diegoah905@gmail.com',
  website: 'https://diegoalvarez.site',
  websiteLabel: 'diegoalvarez.site',
  institution: 'Universidad Nacional Abierta y a Distancia (UNAD)',
} as const;

/** Descriptive User-Agent required by the OpenStreetMap / Overpass usage policies. */
export const USER_AGENT = `MedellinBotSalud/2.0 (+${SITE.website}; ${SITE.email})`;
