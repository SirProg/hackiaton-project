# 🏥 Estimador Agéntico de Copago y Cobertura para el Paciente

> Agente conversacional con IA que ayuda al paciente a entender su beneficio **antes** de atenderse. El paciente ingresa su síntoma, el agente sugiere la especialidad médica adecuada y, cruzando datos con su plan de seguro, indica exactamente cuánto será su copago y qué hospital de la red le conviene más económicamente.

---

## 🌐 Enlaces del Proyecto

| Recurso | URL |
|---|---|
| Aplicación web | https://copago-estimador.vercel.app |
| API Backend | https://copago-api.onrender.com |
| Repositorio | https://github.com/tu-org/copago-estimador |

---

## 📋 Tabla de Contenidos

1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Características](#características)
3. [Arquitectura del Agente](#arquitectura-del-agente)
4. [Estructura de Carpetas](#estructura-de-carpetas)
5. [Stack Tecnológico](#stack-tecnológico)
6. [Requisitos Previos](#requisitos-previos)
7. [Instalación y Configuración](#instalación-y-configuración)
8. [Variables de Entorno](#variables-de-entorno)
9. [Datos Mock](#datos-mock)
10. [Uso de la Aplicación](#uso-de-la-aplicación)
11. [Ejemplos de Conversación](#ejemplos-de-conversación)
12. [Despliegue en Producción](#despliegue-en-producción)
13. [Plan de Desarrollo (3 Días)](#plan-de-desarrollo-3-días)
14. [Decisiones Técnicas](#decisiones-técnicas)
15. [Equipo](#equipo)
16. [Licencia](#licencia)

---

## Descripción del Proyecto

Este proyecto fue desarrollado en el marco de un hackathon bajo el tema **"Estimador Agéntico de Copago y Cobertura para el Paciente"**.

El sistema aborda un problema real: los pacientes frecuentemente desconocen cuánto pagarán por una consulta médica hasta después de recibirla, lo que genera incertidumbre financiera y a veces lleva a postergar atención necesaria. Esta solución convierte ese proceso opaco en una experiencia conversacional clara y proactiva.

### ¿Qué hace el agente?

1. El paciente describe su síntoma en lenguaje natural (español o inglés)
2. El agente clasifica el síntoma y determina la especialidad médica correspondiente
3. Consulta el plan de seguro del paciente (deducible, copagos, red de hospitales)
4. Calcula el costo exacto según el tipo de visita y el estado del deducible
5. Presenta un ranking de hospitales en la red ordenados por menor costo
6. Responde preguntas de seguimiento y recuerda el contexto de la conversación

---

## Características

- **Enrutamiento de síntomas** — clasifica síntomas en lenguaje natural y los mapea a la especialidad correcta usando el LLM
- **Cálculo de copago personalizado** — considera deducible (cumplido/no cumplido), red (dentro/fuera), y tipo de visita (médico general, especialista, urgencias, laboratorios)
- **Comparación de hospitales** — recupera y ordena los mejores 3 hospitales de la red usando búsqueda semántica (RAG con ChromaDB)
- **Tarjeta de comparación estructurada** — el frontend renderiza una tabla visual con costos, no solo texto plano
- **Memoria multi-turno** — el agente recuerda el plan del paciente y síntomas anteriores durante la sesión
- **Preguntas aclaratorias** — cuando el síntoma es ambiguo, el agente hace preguntas dirigidas antes de recomendar
- **Respuestas en streaming** — las respuestas se transmiten token a token vía SSE para una experiencia fluida
- **Selector de plan de seguro** — el paciente elige su plan al inicio, antes de la primera consulta
- **Manejo de casos borde** — responde correctamente cuando el síntoma no tiene cobertura, el hospital está fuera de red, o el deducible no se ha cumplido

---

## Arquitectura del Agente

El agente está construido con **LangGraph**, un framework de grafos de estado para agentes multi-paso. Cada nodo del grafo cumple una función específica y recibe el estado acumulado del anterior.

```
Entrada del paciente
(síntoma + ID del plan)
        │
        ▼
┌─────────────────────────┐
│     Enrutador de        │  El LLM clasifica el síntoma.
│       Síntomas          │  Si es ambiguo, genera preguntas
└────────────┬────────────┘  aclaratorias y espera respuesta.
             │
             ▼
┌─────────────────────────┐
│   Buscador de           │  Búsqueda semántica en ChromaDB
│    Especialidad         │  sobre la tabla síntoma → especialidad.
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   Motor de Cálculo      │  Aplica reglas del plan de seguro:
│      de Copago          │  tipo de visita, deducible, red.
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   Clasificador de       │  ChromaDB recupera hospitales
│     Hospitales          │  filtrados por especialidad y red.
└────────────┬────────────┘  Ordena por menor copago.
             │
             ▼
  Respuesta estructurada
  transmitida via SSE
  al frontend (Next.js)
```

### Estado del Agente (`AgentState`)

```python
class AgentState(TypedDict):
    messages: list[BaseMessage]       # Historial de la conversación
    plan_id: str                      # ID del plan de seguro del paciente
    symptom: str                      # Síntoma ingresado por el paciente
    specialty: str                    # Especialidad determinada por el agente
    visit_type: str                   # primary_care | specialist | er | labs
    deductible_met: bool              # ¿El deducible anual está cumplido?
    copay_amount: float               # Monto de copago calculado
    hospitals: list[HospitalResult]   # Hospitales rankeados por costo
    needs_clarification: bool         # ¿El agente necesita más información?
    clarification_question: str       # Pregunta aclaratoria si aplica
```

---

## Estructura de Carpetas

```
copago-estimador/
│
├── frontend/                              # Aplicación Next.js 14 (React)
│   ├── app/
│   │   ├── layout.tsx                     # Layout raíz, fuentes, estilos globales
│   │   ├── page.tsx                       # Página de inicio + selector de plan
│   │   ├── globals.css                    # Estilos globales con variables Tailwind
│   │   └── chat/
│   │       └── page.tsx                   # Interfaz principal del chat
│   │
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx             # Lista de mensajes + scroll automático
│   │   │   ├── ChatInput.tsx              # Campo de entrada + botón de envío
│   │   │   └── MessageBubble.tsx          # Burbuja de mensaje usuario/agente
│   │   ├── cards/
│   │   │   ├── HospitalCard.tsx           # Tarjeta de comparación de hospitales
│   │   │   ├── CopayBadge.tsx             # Píldora de costo (red/fuera de red)
│   │   │   └── PlanSummaryCard.tsx        # Resumen del plan activo del paciente
│   │   └── ui/
│   │       ├── PlanSelector.tsx           # Selector de plan en onboarding
│   │       ├── LoadingDots.tsx            # Animación mientras el agente piensa
│   │       └── StreamingText.tsx          # Texto que aparece token a token
│   │
│   ├── lib/
│   │   ├── api.ts                         # Cliente SSE para el endpoint /chat
│   │   ├── types.ts                       # Interfaces TypeScript compartidas
│   │   └── utils.ts                       # Formateo de moneda, fechas, etc.
│   │
│   ├── hooks/
│   │   ├── useChat.ts                     # Hook principal: estado y lógica del chat
│   │   └── useStream.ts                   # Hook para consumir SSE del backend
│   │
│   ├── public/
│   │   └── logo.svg
│   │
│   ├── .env.local.example
│   ├── tailwind.config.ts
│   ├── next.config.mjs
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                               # API FastAPI (Python 3.11)
│   ├── main.py                            # App FastAPI: CORS, rutas, SSE /chat
│   │
│   ├── agent/
│   │   ├── graph.py                       # Definición del grafo LangGraph
│   │   ├── state.py                       # AgentState (TypedDict + Pydantic)
│   │   ├── memory.py                      # Checkpointer para memoria multi-turno
│   │   ├── tools.py                       # Herramientas LangChain del agente
│   │   └── nodes/
│   │       ├── __init__.py
│   │       ├── symptom_router.py          # Nodo 1: clasificar síntoma con LLM
│   │       ├── specialty_matcher.py       # Nodo 2: RAG síntoma → especialidad
│   │       ├── cost_calculator.py         # Nodo 3: motor de reglas de copago
│   │       └── hospital_ranker.py         # Nodo 4: búsqueda semántica hospitales
│   │
│   ├── data/
│   │   ├── planes.json                    # Planes de seguro con reglas de copago
│   │   ├── hospitales.json                # Red hospitalaria con especialidades
│   │   ├── especialidades.json            # Mapeo síntoma → especialidad (30+ entradas)
│   │   └── seed_chroma.py                 # Script: carga los datos en ChromaDB
│   │
│   ├── db/
│   │   └── chroma/                        # Almacenamiento persistente ChromaDB
│   │                                      # (incluido en .gitignore)
│   ├── schemas/
│   │   ├── request.py                     # Schema entrada: ChatRequest
│   │   └── response.py                    # Schema salida: HospitalResult, CopayResult
│   │
│   ├── tests/
│   │   ├── test_symptom_router.py         # Pruebas unitarias nodo 1
│   │   ├── test_cost_calculator.py        # Pruebas unitarias nodo 3
│   │   └── test_agent_flow.py             # Prueba de integración flujo completo
│   │
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── .github/
│   └── workflows/
│       ├── ci.yml                         # Lint + tests en cada PR
│       └── deploy.yml                     # Deploy automático a Render en push a main
│
├── docs/
│   ├── arquitectura.md                    # Diagrama detallado de la arquitectura
│   ├── datos-mock.md                      # Documentación de los datos ficticios
│   └── demo-scenarios.md                  # Escenarios dorados para la demo
│
├── .gitignore
├── docker-compose.yml                     # Desarrollo local: backend + ChromaDB
└── README.md
```

---

## Stack Tecnológico

| Capa | Herramienta | Versión | Justificación |
|---|---|---|---|
| Frontend | Next.js + React | 14.x | App Router, soporte SSE nativo, deploy en Vercel con un clic |
| Estilos | Tailwind CSS + shadcn/ui | 3.x | Componentes accesibles listos para chat, sin tiempo de diseño |
| Backend | FastAPI (Python) | 0.110+ | Async nativo, streaming SSE, validación Pydantic, rápido de prototipar |
| Framework agente | LangGraph | 0.1+ | Grafo de estado multi-nodo, memoria con checkpointer, condicionales |
| Orquestación LLM | LangChain | 0.2+ | Herramientas, prompts, integración con Groq y ChromaDB |
| Modelo LLM | Groq `llama-3.1-70b-versatile` | — | Tier gratuito, inferencia <1 s, API compatible con OpenAI |
| Base de datos vectorial | ChromaDB (embebido) | 0.5+ | Sin infraestructura, búsqueda semántica en proceso, persistencia local |
| Despliegue frontend | Vercel | — | Gratuito, HTTPS, deploy automático desde GitHub |
| Despliegue backend | Render | — | Tier gratuito, soporte Docker, variables de entorno seguras |

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 18 o superior → [nodejs.org](https://nodejs.org)
- **Python** 3.11 o superior → [python.org](https://python.org)
- **Git** → [git-scm.com](https://git-scm.com)
- **Una API Key de Groq** (gratuita) → [console.groq.com](https://console.groq.com)

Verifica las versiones:

```bash
node --version    # debe mostrar v18.x o superior
python --version  # debe mostrar 3.11.x o superior
git --version
```

---

## Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-org/copago-estimador.git
cd copago-estimador
```

### 2. Configurar el Backend

```bash
# Entrar a la carpeta del backend
cd backend

# Crear entorno virtual
python -m venv .venv

# Activar el entorno virtual
# En macOS / Linux:
source .venv/bin/activate
# En Windows (CMD):
.venv\Scripts\activate.bat
# En Windows (PowerShell):
.venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r requirements.txt

# Copiar y configurar variables de entorno
cp .env.example .env
# Abre .env con tu editor y agrega tu GROQ_API_KEY

# Cargar los datos mock en ChromaDB (solo la primera vez)
python data/seed_chroma.py

# Iniciar el servidor de desarrollo
uvicorn main:app --reload --port 8000
```

El backend estará disponible en: `http://localhost:8000`
Documentación interactiva (Swagger): `http://localhost:8000/docs`

### 3. Configurar el Frontend

Abre una nueva terminal:

```bash
# Entrar a la carpeta del frontend
cd frontend

# Instalar dependencias
npm install

# Copiar y configurar variables de entorno
cp .env.local.example .env.local
# Edita .env.local y establece NEXT_PUBLIC_API_URL=http://localhost:8000

# Iniciar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en: `http://localhost:3000`

### 4. (Opcional) Ejecutar con Docker Compose

Si prefieres no instalar Python localmente:

```bash
# Desde la raíz del proyecto
cp backend/.env.example backend/.env
# Agrega tu GROQ_API_KEY en backend/.env

docker-compose up --build
```

Esto levanta el backend en el puerto `8000` y el frontend en el `3000` automáticamente.

---

## Variables de Entorno

### Backend — `backend/.env`

```env
# --- LLM ---
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx   # API Key de Groq (requerida)
LLM_MODEL=llama-3.1-70b-versatile               # Modelo de Groq a usar
LLM_TEMPERATURE=0.2                              # Temperatura baja para respuestas consistentes
LLM_MAX_TOKENS=1024                              # Tokens máximos por respuesta

# --- ChromaDB ---
CHROMA_PERSIST_DIR=./db/chroma                  # Directorio de persistencia vectorial
CHROMA_COLLECTION_HOSPITALES=hospitales         # Nombre de la colección de hospitales
CHROMA_COLLECTION_ESPECIALIDADES=especialidades # Nombre de la colección de especialidades

# --- API ---
ALLOWED_ORIGINS=http://localhost:3000,https://copago-estimador.vercel.app
API_PORT=8000

# --- Agente ---
MAX_CLARIFICATION_TURNS=2   # Máximo de turnos de aclaración antes de responder igual
TOP_K_HOSPITALS=3           # Número de hospitales a mostrar en la comparación
```

### Frontend — `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000   # URL base del backend
NEXT_PUBLIC_APP_NAME=Estimador de Copago   # Nombre mostrado en la UI
```

---

## Datos Mock

El proyecto incluye datos ficticios pero realistas. No se requiere ninguna API de seguros real.

### Planes de Seguro — `backend/data/planes.json`

```json
[
  {
    "id": "plan-basico",
    "nombre": "Plan Básico",
    "deducible_anual": 1500,
    "copagos": {
      "medico_general": { "deducible_cumplido": 20, "deducible_no_cumplido": 80 },
      "especialista":   { "deducible_cumplido": 40, "deducible_no_cumplido": 150 },
      "urgencias":      { "deducible_cumplido": 150, "deducible_no_cumplido": 300 },
      "laboratorios":   { "deducible_cumplido": 15, "deducible_no_cumplido": 60 }
    },
    "fuera_de_red_multiplicador": 2.5
  },
  {
    "id": "plan-plata",
    "nombre": "Plan Plata",
    "deducible_anual": 800,
    "copagos": {
      "medico_general": { "deducible_cumplido": 15, "deducible_no_cumplido": 50 },
      "especialista":   { "deducible_cumplido": 30, "deducible_no_cumplido": 100 },
      "urgencias":      { "deducible_cumplido": 100, "deducible_no_cumplido": 200 },
      "laboratorios":   { "deducible_cumplido": 10, "deducible_no_cumplido": 40 }
    },
    "fuera_de_red_multiplicador": 2.0
  },
  {
    "id": "plan-oro",
    "nombre": "Plan Oro",
    "deducible_anual": 300,
    "copagos": {
      "medico_general": { "deducible_cumplido": 10, "deducible_no_cumplido": 30 },
      "especialista":   { "deducible_cumplido": 20, "deducible_no_cumplido": 60 },
      "urgencias":      { "deducible_cumplido": 75, "deducible_no_cumplido": 150 },
      "laboratorios":   { "deducible_cumplido": 5,  "deducible_no_cumplido": 20 }
    },
    "fuera_de_red_multiplicador": 1.5
  },
  {
    "id": "plan-platino",
    "nombre": "Plan Platino",
    "deducible_anual": 0,
    "copagos": {
      "medico_general": { "deducible_cumplido": 5,  "deducible_no_cumplido": 5 },
      "especialista":   { "deducible_cumplido": 15, "deducible_no_cumplido": 15 },
      "urgencias":      { "deducible_cumplido": 50, "deducible_no_cumplido": 50 },
      "laboratorios":   { "deducible_cumplido": 0,  "deducible_no_cumplido": 0 }
    },
    "fuera_de_red_multiplicador": 1.2
  }
]
```

### Hospitales — `backend/data/hospitales.json`

```json
[
  {
    "id": "h001",
    "nombre": "Hospital del Norte",
    "ciudad": "Ciudad A",
    "distancia_km": 2.1,
    "en_red": true,
    "especialidades": ["cardiologia", "neurologia", "medicina_general", "urgencias"],
    "calificacion": 4.5,
    "telefono": "+593 2 555-0101"
  },
  {
    "id": "h002",
    "nombre": "Clínica San Marcos",
    "ciudad": "Ciudad A",
    "distancia_km": 4.7,
    "en_red": true,
    "especialidades": ["cardiologia", "ortopedia", "dermatologia", "laboratorios"],
    "calificacion": 4.2,
    "telefono": "+593 2 555-0102"
  },
  {
    "id": "h003",
    "nombre": "Centro Médico Sur",
    "ciudad": "Ciudad A",
    "distancia_km": 1.2,
    "en_red": true,
    "especialidades": ["urgencias", "medicina_general", "pediatria"],
    "calificacion": 3.9,
    "telefono": "+593 2 555-0103"
  },
  {
    "id": "h004",
    "nombre": "Hospital Internacional",
    "ciudad": "Ciudad B",
    "distancia_km": 12.5,
    "en_red": false,
    "especialidades": ["cardiologia", "oncologia", "neurologia", "cirugia"],
    "calificacion": 4.8,
    "telefono": "+593 4 555-0104"
  }
]
```

### Mapeo de Síntomas — `backend/data/especialidades.json`

```json
[
  { "sintoma": "dolor en el pecho, dificultad para respirar, presión en el pecho", "especialidad": "cardiologia", "tipo_visita": "urgencias", "urgencia": "alta" },
  { "sintoma": "dolor de cabeza severo repentino, el peor de mi vida", "especialidad": "neurologia", "tipo_visita": "urgencias", "urgencia": "alta" },
  { "sintoma": "dolor de rodilla, inflamación de rodilla, lesión deportiva", "especialidad": "ortopedia", "tipo_visita": "especialista", "urgencia": "media" },
  { "sintoma": "fiebre en niños, tos en niños, resfriado infantil", "especialidad": "pediatria", "tipo_visita": "medico_general", "urgencia": "baja" },
  { "sintoma": "erupción cutánea, manchas en la piel, picazón generalizada", "especialidad": "dermatologia", "tipo_visita": "especialista", "urgencia": "baja" },
  { "sintoma": "dolor de espalda, lumbalgia, ciática", "especialidad": "ortopedia", "tipo_visita": "medico_general", "urgencia": "baja" },
  { "sintoma": "dolor de cabeza frecuente, migraña con aura, mareo", "especialidad": "neurologia", "tipo_visita": "especialista", "urgencia": "media" },
  { "sintoma": "glucosa alta, sed excesiva, diabetes", "especialidad": "endocrinologia", "tipo_visita": "especialista", "urgencia": "media" },
  { "sintoma": "examen de sangre, análisis de orina, chequeo general", "especialidad": "medicina_general", "tipo_visita": "laboratorios", "urgencia": "baja" },
  { "sintoma": "tos persistente, dificultad para respirar crónica, asma", "especialidad": "neumologia", "tipo_visita": "especialista", "urgencia": "media" }
]
```

Para agregar o modificar datos, edita los archivos JSON y ejecuta `python data/seed_chroma.py` nuevamente.

---

## Uso de la Aplicación

### Flujo del usuario

```
1. El paciente abre la aplicación
        │
        ▼
2. Selecciona su plan de seguro en el onboarding
   (Plan Básico / Plata / Oro / Platino)
        │
        ▼
3. Indica si su deducible anual ya fue cumplido
        │
        ▼
4. Escribe su síntoma en el chat en lenguaje natural
        │
        ▼
5. El agente procesa (puede hacer preguntas aclaratorias)
        │
        ▼
6. Recibe una tarjeta con:
   - Especialidad recomendada
   - Tipo de visita (general / especialista / urgencias)
   - Top 3 hospitales de la red con copago exacto
   - Recomendación del hospital más conveniente
        │
        ▼
7. Puede hacer preguntas de seguimiento:
   "¿Y si voy a urgencias en cambio?"
   "¿Cuánto cuesta el laboratorio?"
   "¿Ese hospital tiene estacionamiento?"
```

### Endpoints de la API

#### `POST /chat`

Envía un mensaje al agente y recibe la respuesta en streaming (SSE).

**Request body:**
```json
{
  "message": "Tengo dolor fuerte en el pecho y me cuesta respirar",
  "session_id": "usuario-abc-123",
  "plan_id": "plan-plata",
  "deductible_met": false
}
```

**Respuesta (SSE):**
```
data: {"type": "token", "content": "Basándome"}
data: {"type": "token", "content": " en tus"}
data: {"type": "token", "content": " síntomas..."}
data: {"type": "hospitals", "data": [{...}, {...}, {...}]}
data: {"type": "done"}
```

#### `GET /health`

Verifica que el backend esté activo.

```json
{ "status": "ok", "version": "1.0.0" }
```

#### `GET /planes`

Devuelve la lista de planes de seguro disponibles.

```json
[
  { "id": "plan-basico", "nombre": "Plan Básico", "deducible_anual": 1500 },
  { "id": "plan-plata",  "nombre": "Plan Plata",  "deducible_anual": 800 },
  ...
]
```

---

## Ejemplos de Conversación

### Escenario 1 — Dolor en el pecho (alta urgencia)

```
Paciente: Tengo dolor fuerte en el pecho y me cuesta respirar

Agente: Basándome en tus síntomas, te recomiendo acudir a Urgencias o
        un Cardiólogo lo antes posible. Esto puede ser señal de algo serio.

        Con tu Plan Plata (deducible no cumplido), estos son tus mejores
        opciones en la red:

        ┌──────────────────────┬──────────────┬──────────┬────────────┐
        │ Hospital             │ Especialidad │ Copago   │ Distancia  │
        ├──────────────────────┼──────────────┼──────────┼────────────┤
        │ ✅ Centro Médico Sur  │ Urgencias    │ $200     │ 1.2 km     │
        │ ✅ Hospital del Norte │ Cardiología  │ $100     │ 2.1 km     │
        │ ✅ Clínica San Marcos │ Cardiología  │ $100     │ 4.7 km     │
        └──────────────────────┴──────────────┴──────────┴────────────┘

        🏆 Recomendación: Hospital del Norte — menor copago para
        cardiología ($100) y buena calificación (4.5/5).

        ⚠️  Si el dolor es muy intenso, llama al 911 o ve directo a
        Urgencias más cercana sin importar la red.
```

### Escenario 2 — Síntoma ambiguo

```
Paciente: Me duele la cabeza

Agente: Para darte la recomendación más precisa, ¿podrías decirme
        cómo es ese dolor de cabeza?

        a) Es un dolor repentino y muy fuerte, "el peor de mi vida"
        b) Es una migraña con náuseas o sensibilidad a la luz
        c) Es un dolor leve después de estrés o muchas horas frente
           a la pantalla

Paciente: Es (b), tengo migraña con náuseas

Agente: Entendido. Para migraña con síntomas asociados te conviene
        ver un Neurólogo.

        Con tu Plan Plata (deducible cumplido):

        ┌──────────────────────┬──────────────┬──────────┬────────────┐
        │ Hospital             │ Especialidad │ Copago   │ Distancia  │
        ├──────────────────────┼──────────────┼──────────┼────────────┤
        │ ✅ Hospital del Norte │ Neurología   │ $30      │ 2.1 km     │
        └──────────────────────┴──────────────┴──────────┴────────────┘

        💡 Solo Hospital del Norte tiene Neurología en tu red.
           Copago: $30 (deducible ya cumplido).
```

### Escenario 3 — Pregunta de seguimiento

```
Paciente: ¿Y si en cambio voy a urgencias?

Agente: Si vas a Urgencias con tu Plan Plata (deducible cumplido),
        el copago sería $100 — más caro que ver al neurólogo ($30).

        A menos que los síntomas sean muy graves, te conviene más
        pedir cita con el Neurólogo en Hospital del Norte.
```

---

## Despliegue en Producción

### Frontend → Vercel (recomendado)

```bash
# Opción 1: Desde la CLI de Vercel
cd frontend
npx vercel --prod

# Opción 2: Conectar el repositorio en vercel.com
# → New Project → Import GitHub repo → Deploy
```

**Variables de entorno en Vercel:**
- `NEXT_PUBLIC_API_URL` = URL de tu backend en Render (ej: `https://copago-api.onrender.com`)

### Backend → Render

1. Crea una cuenta en [render.com](https://render.com)
2. Haz clic en **New → Web Service**
3. Conecta tu repositorio de GitHub
4. Configura el servicio:

| Campo | Valor |
|---|---|
| Root Directory | `backend` |
| Runtime | `Python 3` |
| Build Command | `pip install -r requirements.txt && python data/seed_chroma.py` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

5. Agrega variables de entorno:
   - `GROQ_API_KEY` = tu API key de Groq
   - `ALLOWED_ORIGINS` = `https://copago-estimador.vercel.app`

> **Importante — Render Free Tier:** El servidor se suspende tras 15 minutos de inactividad. Configura un ping automático con [UptimeRobot](https://uptimerobot.com) apuntando a `https://copago-api.onrender.com/health` cada 10 minutos para mantenerlo activo durante la demo.

### Verificar el despliegue

```bash
# Verificar que el backend esté vivo
curl https://copago-api.onrender.com/health

# Verificar los planes disponibles
curl https://copago-api.onrender.com/planes
```

---

## Plan de Desarrollo (3 Días)

### Día 1 — Fundación e Infraestructura

**Objetivo:** Que el agente responda end-to-end, aunque sin pulir.

| Hora | Tarea |
|---|---|
| 9:00 – 10:00 | Inicializar repositorio, estructura de carpetas, CI básico |
| 10:00 – 12:00 | Crear datos mock (planes, hospitales, especialidades) |
| 12:00 – 14:00 | Construir el grafo LangGraph con los 4 nodos básicos |
| 14:00 – 15:00 | Endpoint `POST /chat` con streaming SSE en FastAPI |
| 15:00 – 17:00 | Shell básico del chat en Next.js (burbujas, entrada de texto) |
| 17:00 – 18:00 | Primer despliegue en Vercel + Render (aunque sea sin estilos) |

**✅ Entregable del día:** El agente responde síntoma → especialidad → copago, y hay una URL pública funcionando.

---

### Día 2 — Inteligencia del Agente

**Objetivo:** RAG real, cálculo de copago preciso, memoria multi-turno.

| Hora | Tarea |
|---|---|
| 9:00 – 10:30 | Cargar hospitales y especialidades en ChromaDB con embeddings |
| 10:30 – 12:00 | Implementar nodo RAG: retrieval semántico de hospitales |
| 12:00 – 13:30 | Motor de cálculo de copago (deducible, tipo de visita, multiplicador fuera de red) |
| 13:30 – 15:00 | Memoria multi-turno con LangGraph checkpointer |
| 15:00 – 16:30 | Preguntas aclaratorias automáticas cuando el síntoma es ambiguo |
| 16:30 – 18:00 | Pruebas con 10 síntomas diferentes, ajustar prompts |

**✅ Entregable del día:** El agente compara hospitales, calcula copagos exactos y recuerda el contexto de la conversación.

---

### Día 3 — Pulido y Entrega

**Objetivo:** UI de calidad, casos borde cubiertos, demo lista, entregables completos.

| Hora | Tarea |
|---|---|
| 9:00 – 10:30 | Rediseño de la UI: tarjeta de comparación de hospitales, selector de plan |
| 10:30 – 11:30 | Streaming de tokens en el frontend (sensación de IA real) |
| 11:30 – 12:30 | Flujo de onboarding: selector de plan + deducible antes del chat |
| 12:30 – 13:30 | Manejo de casos borde: síntoma sin cobertura, hospital fuera de red, deducible no cumplido |
| 13:30 – 15:00 | Smoke-test con 15 escenarios, corrección de bugs críticos |
| 15:00 – 16:30 | Escribir README final, grabar GIF de demo, actualizar documentación |
| 16:30 – 17:30 | Deploy final, verificar URL pública y repositorio limpio |
| 17:30 – 18:00 | Preparar presentación de 3–5 minutos con los 3 escenarios dorados |

**✅ Entregables finales:**
- 🔗 URL pública de la aplicación funcionando
- 📁 Repositorio GitHub/GitLab con código limpio y README completo

---

## Decisiones Técnicas

### ¿Por qué LangGraph y no LangChain Agent simple?

El flujo de este agente tiene nodos con responsabilidades claramente separadas (clasificar, buscar, calcular, rankear). LangGraph permite modelar exactamente eso como un grafo de estados, con condicionales (si el síntoma es ambiguo → nodo de aclaración, si no → continuar). Un agente ReAct de LangChain sería menos predecible y más difícil de depurar en un hackathon.

### ¿Por qué Groq y no OpenAI?

Groq ofrece un tier gratuito con `llama-3.1-70b-versatile` con velocidades de inferencia muy superiores (tokens/s). Para una demo en vivo, la velocidad importa. La API es 100% compatible con el cliente de OpenAI, por lo que cambiar de modelo es un cambio de una línea.

### ¿Por qué ChromaDB embebido y no Pinecone o Weaviate?

Para un hackathon de 3 días, ChromaDB embebido elimina toda la fricción de configuración de infraestructura. Corre en proceso, persiste en disco, y su API es simple. Para producción real se migra a ChromaDB Cloud o Pinecone sin cambiar el código del agente.

### ¿Por qué datos mock y no APIs reales de seguros?

Las APIs reales de seguros (Availity, Change Healthcare, etc.) requieren contratos, credenciales corporativas y semanas de integración. Para demostrar el concepto del agente, datos ficticios bien estructurados son equivalentes desde el punto de vista del jurado. El valor está en la lógica del agente, no en la fuente de datos.

---

## Equipo

Desarrollado en **[Nombre del Hackathon]** — **[Fecha]**

| Nombre | Rol |
|---|---|
| — | Agente IA / Backend (LangGraph + FastAPI) |
| — | Frontend / UX (Next.js + React) |
| — | Datos / Prompt Engineering / QA |

---

## Licencia

MIT — consulta el archivo [LICENSE](LICENSE) para más detalles.

---

<div align="center">
  <p>Construido con ❤️ para mejorar la experiencia del paciente en el sistema de salud</p>
</div>
