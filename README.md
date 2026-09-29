# MedellínBot Salud

Asistente de salud pública para Medellín y el Valle de Aburrá. Reúne en una sola aplicación, gratuita y sin registro, los
**datos abiertos oficiales** de la ciudad y del país: dónde atenderse, cómo está el aire, qué vacunas corresponden por edad,
líneas de ayuda y los principales indicadores epidemiológicos.

## Secciones

| Ruta | Qué ofrece |
|---|---|
| `/` | Inicio con "Hoy en Medellín" en vivo (ICA del SIATA, índice UV, clima) y una barra para preguntar al asistente. |
| `/chat` | Asistente con IA (OpenAI) que responde con datos consultados en el momento. Streaming, Markdown, historial local, ubicación opcional y tarjetas de servicios / aire. Si no hay IA disponible responde en *modo básico* con los mismos datos. |
| `/mapa` | ~700 hospitales, centros de salud, clínicas, farmacias, laboratorios y odontología. Búsqueda, filtros, "Abierto ahora", "Cerca de mí", estación de Metro más cercana, llamar y cómo llegar. |
| `/aire` | ICA de la ciudad y de las 23 estaciones del SIATA, serie horaria de 72 h por estación, recomendaciones por grupo de riesgo e índice UV por hora. |
| `/vacunacion` | Esquema nacional PAI 2026 y un buscador "¿Qué vacunas le tocan?" por edad o gestación. |
| `/emergencias` | 123, salud mental (Línea Amiga, 106), violencia (155, 122), niñez (141) y citas de Metrosalud, con un toque para llamar, y señales de alarma para decidir entre urgencias o cita. |
| `/indicadores` | Cobertura de vacunación, dengue por año, eventos SIVIGILA más notificados y red de IPS por municipio. |
| `/acerca` | Fuentes, metodología, privacidad y aviso legal. |

## Fuentes de datos

Todas son públicas y no requieren API key. Detalle de endpoints y campos en [`docs/fuentes-de-datos.md`](docs/fuentes-de-datos.md).

- **REPS · MinSalud** (datos.gov.co `c36g-9fc2`): sedes de IPS habilitadas, teléfonos y naturaleza pública/privada.
- **MEData · Alcaldía de Medellín**: centros de atención de Metrosalud, geolocalizados.
- **SIATA · AMVA**: PM2.5 e ICA por estación, cada hora.
- **INS · SIVIGILA** (`4hyg-wa9d`) y **Gobernación de Antioquia** (`8u7u-645t`): eventos de salud pública y cobertura de vacunación.
- **MinSalud · PAI**: esquema de vacunación, julio 2026.
- **OpenStreetMap** (Overpass, ODbL): ubicación de servicios, estaciones del Metro y barrios.
- **Open-Meteo** (CC BY 4.0): clima, índice UV y contaminantes modelados (respaldo).

## Puesta en marcha

Requisitos: Node.js 20+ y pnpm.

```bash
pnpm install
cp .env.example .env.local   # agrega tu OPENAI_API_KEY
pnpm dev                     # http://localhost:3000
```

Otros scripts:

```bash
pnpm build        # compilación de producción
pnpm lint         # ESLint
pnpm type-check   # TypeScript sin emitir
pnpm data:sync    # descarga todas las fuentes a data/snapshots/
pnpm data:sync osm-health reps-aburra   # solo algunas
```

### Cómo se mantienen los datos al día

`data/snapshots/*.json` guarda una copia versionada de cada fuente. En ejecución, cada fuente se sirve desde su copia mientras
sea reciente (7 días para la red de salud, 30 para Metrosalud) y, cuando envejece, se consulta en vivo y se guarda en memoria;
si la fuente no responde, se sigue usando la copia. Aire y clima se consultan siempre en vivo, con caché de 15–30 minutos.
Ejecuta `pnpm data:sync` periódicamente (por ejemplo con un cron semanal) y haz commit de los cambios.

## Arquitectura

```
src/
├── app/                  # Rutas (App Router) y API: /api/chat, /api/services, /api/air/series/[code]
├── components/           # UI por dominio (chat, map, environment, vaccination, charts, layout, ui)
├── hooks/                # useConversations (historial local), useGeolocation
├── lib/
│   ├── sources/          # Conectores puros por fuente (REPS, Metrosalud, SIATA, OSM, indicadores) — usados también por el script de sync
│   ├── server/           # Caché, snapshots, agregadores y recuperación de contexto (RAG) para el chat
│   ├── knowledge/        # Conocimiento curado y verificado: líneas de ayuda y esquema PAI
│   └── *.ts              # ICA (Res. 2254/2017), horarios OSM, teléfonos, geografía, formato
└── types/
scripts/sync-data.ts      # Descarga de fuentes → data/snapshots
```

Stack: Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Leaflet + OpenStreetMap · OpenAI · Framer Motion.

## Privacidad

- El historial del chat se guarda solo en el navegador (`localStorage`) y se puede borrar desde la barra lateral.
- La ubicación se pide únicamente al pulsar "Cerca de mí" o el botón de ubicación del chat; se usa para ordenar y no se almacena.
- Para responder, la pregunta y el contexto de datos públicos se envían a OpenAI.

## Aviso

Servicio informativo: no ofrece diagnósticos ni reemplaza la consulta médica. En una emergencia llama al **123**.

Proyecto académico — Universidad Nacional Abierta y a Distancia (UNAD). Contacto: daalvarezherr@unadvirtual.edu.co
