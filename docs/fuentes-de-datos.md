# Fuentes de datos abiertos

Todas las fuentes se verificaron con llamadas reales el 28 de septiembre de 2026. Ninguna requiere API key.
El código de cada conector está en `src/lib/sources/`.

## 1. REPS — Registro Especial de Prestadores de Servicios de Salud

- **Entidad:** Ministerio de Salud y Protección Social, publicado en Datos Abiertos Colombia (Socrata).
- **Dataset:** [`c36g-9fc2`](https://www.datos.gov.co/d/c36g-9fc2) · licencia CC BY-SA 4.0 · corte trimestral.
- **Consulta usada** (IPS de los 10 municipios del Valle de Aburrá):

  ```
  https://www.datos.gov.co/resource/c36g-9fc2.json
    ?$where=municipiosede in('05001','05088','05266','05360','05631','05380','05129','05212','05308','05079')
            AND claseprestador like 'Instituciones%'
    &$limit=5000
  ```

- **Campos:** `nombreprestador`, `nombresede`, `codigohabilitacionsede`, `naturalezajuridica` (Pública/Privada/Mixta), `ese`,
  `municipiosede` (código DANE), `direcci_nsede`, `t_lefonosede`, `email_sede`.
- **Notas:**
  - Filtrar por código DANE, no por nombre con tildes.
  - No trae coordenadas. Por eso se cruza por nombre con OSM y Metrosalud para agregar teléfonos y naturaleza jurídica
    (`src/lib/sources/network.ts`).
  - Sin app token, Socrata limita las consultas por IP; por eso se guarda en una instantánea.

## 2. MEData — Centros de atención de Metrosalud

- **Entidad:** Alcaldía de Medellín / ESE Metrosalud. Dataset `1-048-22-000400` · CC BY-SA 4.0.
- **Archivo:** `https://medata.gov.co/sites/default/files/distribution/1-048-22-000400/centros_atencion_metrosalud.csv`
- **Columnas:** `centro atención, direccion, comuna, barrio, Longitud, Latitud` (51 sedes).
- **Notas:**
  - MEData funciona con DKAN, no con CKAN; el catálogo está en `https://medata.gov.co/data.json`.
  - Algunas direcciones traen espacios no separables (` `), que se limpian al importar.

## 3. SIATA — Calidad del aire

- **Entidad:** Sistema de Alerta Temprana del Valle de Aburrá (AMVA).
- **Estaciones de PM2.5** (GeoJSON, 23 estaciones, se actualiza cada hora):
  `https://geoportal.siata.gov.co/fastgeoapi/geodata/geodataJson/1/pm25_minio`
  - Propiedades: `nombreEstacion`, `Municipio`, `codigo`, `PM25_24H_prom`, `ICA_24H_prom`, `fechaFin`.
- **Serie de 72 horas por estación:** `https://geoportal.siata.gov.co/fastgeoapi/geodata/geographJson/1/pm25/{codigo}`
- **Notas:**
  - Son los endpoints del geoportal oficial y no están documentados. Solo se llaman desde el servidor, con caché de 20 minutos.
    Si fallan, se usa Open-Meteo como respaldo y se etiqueta como "estimado".
  - Los archivos antiguos `EntregaData1/*.json` dejaron de actualizarse en 2024.
- **ICA:** se calcula con los puntos de corte de la Resolución 2254 de 2017 (`src/lib/air-quality.ts`).
  El valor de la ciudad es la mediana del ICA de 24 horas de las estaciones de Medellín.

## 4. OpenStreetMap (Overpass API)

- **Uso:** servicios de salud geolocalizados (`amenity`/`healthcare`), estaciones de Metro/Metrocable/Tranvía y barrios
  (`place=suburb|neighbourhood|…`).
- **Servidores:** `overpass-api.de`, con respaldo en `overpass.private.coffee` y `overpass.kumi.systems`.
- **Licencia:** ODbL. Hay que mostrar "© colaboradores de OpenStreetMap".
- **Política de uso:** User-Agent descriptivo y nada de consultas por cada petición de usuario. Se sincroniza con `pnpm data:sync`.
- **Mosaicos del mapa:** `tile.openstreetmap.org`. CARTO ahora exige API key, por eso no se usa.

## 5. Open-Meteo

- **Pronóstico:** `https://api.open-meteo.com/v1/forecast` (temperatura, lluvia, `uv_index`, `uv_index_max`).
- **Calidad del aire modelada (CAMS):** `https://air-quality-api.open-meteo.com/v1/air-quality`.
  Subestima el PM2.5 dentro del valle, así que solo aporta PM10 y ozono, o sirve de respaldo.
- **Licencia:** CC BY 4.0, gratuito para uso no comercial.

## 6. Indicadores epidemiológicos

| Dataset | Entidad | Uso | Cobertura |
|---|---|---|---|
| [`4hyg-wa9d`](https://www.datos.gov.co/d/4hyg-wa9d) | Instituto Nacional de Salud (SIVIGILA) | Dengue por año y eventos más notificados (`cod_mun_o='5001'`) | 2007–2022 |
| [`8u7u-645t`](https://www.datos.gov.co/d/8u7u-645t) | Gobernación de Antioquia | Cobertura anual de vacunación (`codigomunicipio='5001'`) | 1980–2025 |

Los códigos DANE de estos datasets no tienen el cero inicial.

## 7. Conocimiento curado (`src/lib/knowledge/`)

- **Líneas de ayuda** verificadas en medellin.gov.co, minsalud.gov.co, icbf.gov.co y metrosalud.gov.co.
  Cada línea guarda la URL de su fuente y la fecha de verificación (`HELP_LINES_VERIFIED_AT`).
- **Esquema PAI:** afiche oficial del Ministerio de Salud, [actualización julio 2026](https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/VS/PP/ET/afiche-esquema-vacunacion-col-2026.pdf).

## Fuentes evaluadas y descartadas

- **Metro de Medellín GTFS** (ArcGIS Hub): funciona, pero el calendario venció en diciembre de 2025.
  Las estaciones se toman de OSM.
- **MEData "Registro diario de vacunación":** solo tiene datos de COVID-19 de 2021.
- **Línea 192 opción 4:** era una línea de la pandemia y su página ya no existe. Se usa la Línea 106.
