# 🏥 MedellínBot Salud

Tu asistente de salud pública inteligente para la ciudad de Medellín. Encuentra servicios de salud, información de vacunación, calidad del aire y rutas de transporte mediante conversación natural con IA.

![MedellínBot Salud](https://img.shields.io/badge/version-1.0.0-teal) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![TailwindCSS](https://img.shields.io/badge/Tailwind-3.0-cyan)

## ✨ Características

- 💬 **Chat Inteligente**: Conversación natural con IA para obtener información de salud
- 🏥 **Servicios de Salud**: Encuentra hospitales, clínicas y centros de vacunación cercanos
- 🌫️ **Calidad del Aire**: Monitoreo en tiempo real con recomendaciones personalizadas
- 🚌 **Rutas de Transporte**: Obtén las mejores rutas en transporte público
- 🗺️ **Mapa Interactivo**: Visualiza todos los servicios de salud en un mapa
- 🌗 **Modo Oscuro**: Interfaz adaptable con tema claro y oscuro
- 📱 **PWA**: Instalable en dispositivos móviles
- ♿ **Accesible**: Diseño WCAG AA compliant

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion
- **Maps**: React Leaflet
- **State Management**: Zustand
- **Icons**: Lucide React
- **Theming**: next-themes

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ y npm/yarn/pnpm
- Git (opcional)

### Pasos de Instalación

1. **Clonar el repositorio** (o descargar los archivos):

```bash
git clone <repository-url>
cd bolt-project
```

1. **Instalar dependencias**:

```bash
npm install
# o
yarn install
# o
pnpm install
```

1. **Ejecutar el servidor de desarrollo**:

```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

1. **Abrir en el navegador**:

```
http://localhost:3000
```

## 📁 Estructura del Proyecto

```
bolt-project/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── chat/              # Chat interface
│   │   ├── mapa/              # Map view
│   │   ├── acerca/            # About page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── chat/              # Chat components
│   │   ├── landing/           # Landing page components
│   │   ├── layout/            # Header, Footer
│   │   ├── shared/            # Shared components
│   │   └── map/               # Map components
│   ├── lib/
│   │   ├── mock-data.ts       # Mock data for demo
│   │   └── utils.ts           # Utility functions
│   └── types/
│       └── index.ts           # TypeScript types
├── public/
│   └── manifest.json          # PWA manifest
├── tailwind.config.ts         # Tailwind configuration
└── package.json
```

## 🎨 Características de Diseño

### Paleta de Colores

- **Primario (Verde Esmeralda)**: `#10b981`, `#059669` - Salud, bienestar, naturaleza
- **Secundario (Azul Confianza)**: `#3b82f6`, `#2563eb` - Profesionalismo, tecnología
- **Acento (Naranja Cálido)**: `#f97316`, `#ea580c` - Llamados a acción importantes
- **Estados Semánticos**:
  - ✅ Verde: Servicios abiertos, buena calidad del aire
  - ⚠️ Amarillo: Advertencias, calidad moderada
  - 🔴 Rojo: Emergencias, calidad dañina

### Efectos Visuales

- **Glassmorphism**: Tarjetas con efecto de vidrio esmerilado
- **Gradientes**: Fondos y textos con degradados modernos
- **Animaciones**: Transiciones suaves con Framer Motion
- **Micro-interacciones**: Hover, focus, y efectos de scroll

## 💬 Uso del Chat

El chatbot entiende preguntas en lenguaje natural en español. Ejemplos:

- "¿Dónde está el hospital más cercano?"
- "Necesito información sobre vacunación COVID-19"
- "¿Cómo está la calidad del aire hoy?"
- "¿Cómo llego al Hospital San Vicente?"

## 🗺️ Mapa de Servicios

- Filtra por tipo: Hospitales, Clínicas, Vacunación, Farmacias
- Búsqueda por nombre o dirección
- Marcadores interactivos con información detallada
- Auto-zoom al seleccionar un servicio

## 🔌 Integraciones (Preparadas)

Las siguientes integraciones están preparadas con interfaces pero **NO implementadas**:

- **OpenAI/Claude**: Para IA conversacional (`src/lib/api/openai.ts`)
- **Supabase/PostgreSQL**: Para base de datos (`src/lib/api/supabase.ts`)
- **SIATA**: Para calidad del aire (`src/lib/api/siata.ts`)
- **MEData**: Para servicios de salud (`src/lib/api/medata.ts`)

### Para Implementar APIs Reales

1. Agregar variables de entorno en `.env.local`:

```env
NEXT_PUBLIC_OPENAI_API_KEY=tu_api_key
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_KEY=tu_key
```

1. Implementar las funciones en `src/lib/api/`

## 📱 PWA (Progressive Web App)

La aplicación está configurada como PWA:

- Instalable en dispositivos móviles y desktop
- Funciona offline (básico)
- Icono de app personalizado

Para generar iconos PWA, crea imágenes de 192x192 y 512x512 en `/public/`.

## 🎯 Build de Producción

```bash
npm run build
npm start
```

## 🧪 Verificación

### Checklist de Verificación

- ✅ Landing page con animaciones
- ✅ Chat funcional con respuestas mock
- ✅ Mapa interactivo con marcadores
- ✅ Página "Acerca de" completa
- ✅ Responsive design (móvil, tablet, desktop)
- ✅ Modo oscuro funcional
- ✅ Accesibilidad con navegación por teclado
- ✅ Build sin errores de TypeScript

### Testing Manual

1. Navega por todas las páginas
2. Prueba el chat con diferentes preguntas
3. Filtra servicios en el mapa
4. Cambia entre modo claro y oscuro
5. Redimensiona la ventana para verificar responsive

## ⚠️ Importante - Disclaimer

Este chatbot proporciona **información general** sobre servicios de salud pública. NO proporciona diagnósticos médicos ni reemplaza la consulta con profesionales de la salud.

**En caso de emergencia médica, llame al 123.**

## 👥 Equipo

Desarrollado por estudiantes de la **Universidad Nacional Abierta y a Distancia (UNAD)** como proyecto de investigación en tecnologías aplicadas a la salud pública.

## 📄 Licencia

Este proyecto es de código abierto para fines educativos y de salud pública.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📧 Contacto

- Email: <daalvarezherr@unadvirtual.edu.co>
- Website: [En construcción]

---

**Hecho con ❤️ para mejorar el acceso a la salud pública en Medellín**
