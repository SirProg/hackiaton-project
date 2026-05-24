# 🏥 Estimador Agéntico de Copago y Cobertura para el Paciente

> Agente conversacional con IA que ayuda al paciente a entender su beneficio **antes** de atenderse. El paciente describe su síntoma, el agente determina la especialidad médica adecuada y, cruzando datos con su plan de seguro, indica exactamente cuánto será su copago y qué hospitales de la red le convienen más económicamente.

---

## 🌐 Enlaces del Proyecto

| Recurso | URL |
|---|---|
| Aplicación web | https://hackiaton-project.vercel.app/ |
| Repositorio | https://github.com/SirProg/hackiaton-project |

---

## 📋 Tabla de Contenidos

1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Características](#características)
3. [Arquitectura del Agente](#arquitectura-del-agente)
4. [Stack Tecnológico](#stack-tecnológico)
5. [Estructura de Carpetas](#estructura-de-carpetas)
6. [Modelos de Datos](#modelos-de-datos)
7. [Datos Mock](#datos-mock)
8. [Endpoints de la API](#endpoints-de-la-api)
9. [Instalación y Configuración](#instalación-y-configuración)
10. [Despliegue en Producción](#despliegue-en-producción)
11. [Ejemplos de Conversación](#ejemplos-de-conversación)
12. [Equipo](#equipo)
13. [Licencia](#licencia)

---

## Descripción del Proyecto

Este proyecto fue desarrollado en el marco de un hackathon bajo el tema **"Estimador Agéntico de Copago y Cobertura para el Paciente"**.

El sistema aborda un problema real: los pacientes frecuentemente desconocen cuánto pagarán por una consulta médica hasta después de recibirla, lo que genera incertidumbre financiera y a veces lleva a postergar atención necesaria. Esta solución convierte ese proceso opaco en una experiencia conversacional clara y proactiva.

### ¿Qué hace el agente?

1. El paciente selecciona su plan de seguro e indica si cumplió su deducible anual
2. Describe su síntoma en lenguaje natural (español)
3. El agente clasifica el síntoma — si es ambiguo, hace preguntas aclaratorias
4. Determina la especialidad médica y el tipo de visita correspondiente
5. Calcula el copago exacto según el plan, el deducible y la red del hospital
6. Presenta un ranking de hasta 3 hospitales ordenados por menor copago y distancia
7. Cuando el mejor hospital está fuera de red, responde con empatía y justifica la recomendación por cercanía y costo

---

## Características

- **Enrutamiento de síntomas** — clasifica síntomas en lenguaje natural con LLM (Groq) y detecta ambigüedad automáticamente
- **Preguntas aclaratorias** — cuando el síntoma es ambiguo, el agente pregunta antes de recomendar
- **Cálculo de copago personalizado** — considera deducible (cumplido/no cumplido), red (dentro/fuera), y tipo de visita
- **Comparación de hospitales** — recupera y ordena los mejores 3 hospitales por menor copago y distancia
- **Tarjeta visual de comparación** — el frontend renderiza una tarjeta por hospital con copago, distancia y calificación
- **Memoria multi-turno** — el agente recuerda el contexto de la sesión usando `MemorySaver` de LangGraph
- **Respuestas en Markdown** — negrita, párrafos y formato renderizados con `react-markdown` + `remark-gfm`
- **Selector de plan + deducible** — el paciente configura su situación antes de iniciar el chat
- **Manejo empático de hospitales fuera de red** — mensaje diferenciado con justificación de cercanía y costo

---

## Arquitectura del Agente

El agente está construido con **LangGraph**, un framework de grafos de estado para agentes multi-paso. Cada nodo cumple una función específica y recibe el estado acumulado del anterior.

```
Entrada del paciente
(síntoma + plan_id + deductible_met)
           │
           ▼
┌──────────────────────────────┐
│       symptom_router         │  Groq (llama-3.1-8b-instant) clasifica
│                              │  el síntoma. Si es ambiguo, genera una
│  agent/nodes/                │  pregunta aclaratoria y detiene el grafo.
│  symptom_router.py           │
└─────────────┬────────────────┘
              │ needs_clarification = False
              ▼
┌──────────────────────────────┐
│      specialty_matcher       │  Busca la especialidad en la base de datos
│                              │  (Django ORM). Determina el tipo de visita:
│  agent/nodes/                │  medico_general | especialista |
│  specialty_matcher.py        │  urgencias | laboratorios
└─────────────┬────────────────┘
              │
              ▼
┌──────────────────────────────┐
│      cost_calculator         │  Aplica las reglas del plan de seguro:
│                              │  monto según deducible cumplido/no cumplido
│  agent/nodes/                │  y multiplicador fuera de red.
│  cost_calculator.py          │  Resultado: copago_amount en dólares.
└─────────────┬────────────────┘
              │
              ▼
┌──────────────────────────────┐
│      hospital_ranker         │  Filtra hospitales que ofrecen la
│                              │  especialidad requerida. Aplica multiplicador
│  agent/nodes/                │  fuera de red. Ordena por menor copago
│  hospital_ranker.py          │  y distancia. Devuelve top 3.
└─────────────┬────────────────┘
              │
              ▼
   Respuesta estructurada
   con mensaje Markdown +
   lista de HospitalResult
   enviada al frontend
```

### Estado del Agente (`AgentState`)

```python
class AgentState(TypedDict):
    messages: list[dict]            # Historial de la conversación
    plan_id: int                    # ID del plan de seguro seleccionado
    deductible_met: bool            # ¿El deducible anual está cumplido?
    symptom: str                    # Síntoma ingresado por el paciente
    specialty: str                  # Especialidad determinada por el agente
    tipo_visita: str                # medico_general | especialista | urgencias | laboratorios
    copago_amount: float            # Monto de copago calculado en dólares
    hospitals: list[HospitalResult] # Hospitales rankeados por costo
    needs_clarification: bool       # ¿El agente necesita más información?
    clarification_question: str     # Pregunta aclaratoria si aplica
    error: Optional[str]            # Error si ocurrió alguno
```

---

## Stack Tecnológico

| Capa | Herramienta | Versión | Justificación |
|---|---|---|---|
| Frontend | React + Vite | 19.x / 8.x | SPA liviana, build rápido, deploy directo en Vercel |
| Estilos | Tailwind CSS | 4.x | Utility-first, responsivo, sin tiempo de diseño |
| Animaciones | Framer Motion | 12.x | Animaciones fluidas en landing con mínimo código |
| Markdown | react-markdown + remark-gfm | — | Renderiza respuestas del agente con formato real |
| Backend | Django + DRF | 5.2 / 3.17 | ORM robusto, admin incluido, serializers nativos |
| Framework agente | LangGraph | 1.2 | Grafo de estado multi-nodo, memoria con checkpointer |
| Orquestación LLM | LangChain + langchain-groq | 1.3 / 1.1 | Integración directa con Groq |
| Modelo LLM | Groq `llama-3.1-8b-instant` | — | Tier gratuito, inferencia rápida |
| Base de datos | SQLite | — | Sin infraestructura, suficiente para demo |
| Servidor producción | Gunicorn | 23.x | WSGI production-ready para Django en Render |
| Despliegue frontend | Vercel | — | Gratuito, HTTPS, deploy automático desde GitHub |
| Despliegue backend | Render | — | Servidor persistente, tier gratuito, soporte Python |

---

## Estructura de Carpetas

```
hackiaton-project/
│
├── frontend/                          # Aplicación React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx        # Selector de plan + deducible + hero
│   │   │   └── ChatPage.tsx           # Interfaz del chat con Baymax
│   │   ├── components/
│   │   │   └── HospitalCard.tsx       # Tarjeta visual de comparación de hospitales
│   │   ├── App.tsx                    # Router: / → LandingPage, /chat → ChatPage
│   │   └── index.css
│   ├── .env.local                     # Variables de entorno (no se sube a Git)
│   └── package.json
│
├── backend/                           # API Django + DRF
│   ├── agent/                         # Agente LangGraph
│   │   ├── graph.py                   # Definición del grafo y singleton compilado
│   │   ├── state.py                   # AgentState (TypedDict)
│   │   └── nodes/
│   │       ├── symptom_router.py      # Nodo 1: clasifica síntoma con Groq
│   │       ├── specialty_matcher.py   # Nodo 2: busca especialidad en DB (ORM)
│   │       ├── cost_calculator.py     # Nodo 3: calcula copago según reglas del plan
│   │       └── hospital_ranker.py     # Nodo 4: rankea hospitales por copago y distancia
│   │
│   ├── api/                           # App Django principal
│   │   ├── views.py                   # POST /api/agente/  GET /api/planes/
│   │   └── urls.py
│   │
│   ├── insurance/                     # App: planes, hospitales, especialidades
│   │   ├── models.py                  # InsurancePlan, Hospital, Specialty,
│   │   │                              # CopaymentRule, HospitalSpecialty
│   │   └── fixtures/
│   │       └── initial_data.json      # Datos mock listos para cargar
│   │
│   ├── patients/                      # App: pacientes de ejemplo
│   │   └── models.py
│   │
│   ├── core/                          # Configuración Django
│   │   └── settings.py                # Variables desde .env, CORS, DRF
│   │
│   ├── .env.example                   # Plantilla de variables de entorno
│   └── requirements.txt
│
├── .gitignore
└── README.md
```

---

## Modelos de Datos

```
InsurancePlan                       Hospital
──────────────────────              ──────────────────────
id                                  id
nombre                              nombre
descripcion                         ciudad
deducible_anual                     direccion
fuera_de_red_multiplicador          es_red (bool)
        │                           distancia_km
        │                           calificacion
        ▼                           telefono
CopaymentRule                             │
──────────────────────                    │
plan_id (FK)              HospitalSpecialty
tipo_visita               ──────────────────────
monto_deducible_cumplido  hospital_id (FK)
monto_deducible_no_cumplido specialty_id (FK)
                                          │
                                          ▼
                                    Specialty
                                    ──────────────────────
                                    nombre
                                    tipo_visita
                                    urgencia
```

---

## Datos Mock

El proyecto incluye datos ficticios pero realistas. No se requiere ninguna API de seguros real.

### Planes de Seguro

| Plan | Deducible Anual | Médico General | Especialista | Urgencias | Laboratorios |
|---|---|---|---|---|---|
| Plan Básico | $1,500 | $20 / $80 | $40 / $150 | $150 / $300 | $15 / $60 |
| Plan Plata | $800 | $15 / $50 | $30 / $100 | $100 / $200 | $10 / $40 |
| Plan Oro | $300 | $10 / $30 | $20 / $60 | $75 / $150 | $5 / $20 |
| Plan Platino | $0 | $5 / $5 | $15 / $15 | $50 / $50 | $0 / $0 |

> Formato de copagos: `deducible cumplido / deducible no cumplido`

### Hospitales

| Hospital | Ciudad | Red | Distancia | Calificación | Especialidades |
|---|---|---|---|---|---|
| Hospital del Norte | Ciudad A | ✅ En red | 2.1 km | 4.5 ⭐ | Cardiología, Neurología, Medicina General, Urgencias |
| Clínica San Marcos | Ciudad A | ✅ En red | 4.7 km | 4.2 ⭐ | Cardiología, Ortopedia, Dermatología, Laboratorios |
| Centro Médico Sur | Ciudad A | ✅ En red | 1.2 km | 3.9 ⭐ | Urgencias, Medicina General, Pediatría |
| Hospital Internacional | Ciudad B | ⚠️ Fuera de red | 12.5 km | 4.8 ⭐ | Cardiología, Neurología, Neumología |

### Especialidades disponibles

`cardiologia` · `neurologia` · `ortopedia` · `pediatria` · `dermatologia` · `medicina_general` · `endocrinologia` · `neumologia` · `urgencias` · `laboratorios`

---

## Endpoints de la API

### `POST /api/agente/`

Envía un síntoma al agente y recibe la respuesta con copago y hospitales.

**Request body:**
```json
{
  "plan_id": 2,
  "sintoma": "Tengo dolor fuerte en el pecho y me cuesta respirar",
  "session_id": "usuario-abc-123",
  "deductible_met": false
}
```

**Response:**
```json
{
  "mensaje_agente": "Basándome en tus síntomas te recomiendo acudir a **Cardiologia**...",
  "especialidad_sugerida": "cardiologia",
  "tipo_visita": "urgencias",
  "copago_estimado": 200.0,
  "needs_clarification": false,
  "clarification_question": "",
  "opciones": [
    {
      "id": 1,
      "nombre": "Hospital del Norte",
      "ciudad": "Ciudad A",
      "distancia_km": 2.1,
      "calificacion": 4.5,
      "telefono": "+593 2 555-0101",
      "es_red": true,
      "especialidad": "cardiologia",
      "tipo_visita": "urgencias",
      "copago": 200.0
    }
  ]
}
```

### `GET /api/planes/`

Devuelve los planes disponibles para el selector del frontend.

```json
[
  { "id": 1, "nombre": "Plan Básico",  "descripcion": "...", "deducible_anual": 1500.0 },
  { "id": 2, "nombre": "Plan Plata",   "descripcion": "...", "deducible_anual": 800.0  },
  { "id": 3, "nombre": "Plan Oro",     "descripcion": "...", "deducible_anual": 300.0  },
  { "id": 4, "nombre": "Plan Platino", "descripcion": "...", "deducible_anual": 0.0    }
]
```

### `GET /api/paciente/<numero_poliza>/`

Devuelve los datos de un paciente por número de póliza.

---

## Instalación y Configuración

### Requisitos previos

- **Node.js** 18 o superior
- **Python** 3.11 o superior
- **API Key de Groq** (gratuita) → [console.groq.com](https://console.groq.com)

### Backend

```bash
cd backend

# Crear y activar entorno virtual
python3.11 -m venv .venv
source .venv/bin/activate        # Linux / macOS
# .venv\Scripts\activate         # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Abre .env y agrega tu GROQ_API_KEY

# Crear base de datos y cargar datos mock
python manage.py migrate
python manage.py loaddata insurance/fixtures/initial_data.json

# Iniciar servidor
python manage.py runserver
```

Backend disponible en `http://localhost:8000`

### Frontend

```bash
cd frontend

npm install

# Crear archivo de entorno
echo "VITE_API_URL=http://localhost:8000" > .env.local

npm run dev
```

Frontend disponible en `http://localhost:5173`

---

## Despliegue en Producción

El proyecto usa arquitectura split: **frontend en Vercel** y **backend en Render**.

---

## Ejemplos de Conversación

### Escenario 1 — Urgencia clara

```
Paciente: Tengo dolor fuerte en el pecho y me cuesta respirar

Agente: Basándome en tus síntomas te recomiendo acudir a Cardiología
        (visita tipo: urgencias). Con tu Plan Plata (deducible no cumplido),
        estas son tus opciones disponibles:

        🏆 Recomendación: Hospital del Norte — menor copago ($200)
        y a solo 2.1 km de distancia.

        ┌──────────────────────┬──────────────┬──────────┬────────────┐
        │ Hospital             │ Especialidad │ Copago   │ Distancia  │
        ├──────────────────────┼──────────────┼──────────┼────────────┤
        │ 🏆 Hospital del Norte │ Cardiología  │ $200     │ 2.1 km     │
        │ Clínica San Marcos   │ Cardiología  │ $200     │ 4.7 km     │
        └──────────────────────┴──────────────┴──────────┴────────────┘
```

### Escenario 2 — Síntoma ambiguo

```
Paciente: Me duele la cabeza

Agente: Para darte la recomendación más precisa, ¿cómo describirías
        ese dolor? ¿Es repentino e intenso, una migraña con náuseas,
        o un dolor leve por estrés?

Paciente: Es una migraña con náuseas

Agente: Basándome en tus síntomas te recomiendo acudir a Neurología...
```

### Escenario 3 — Mejor opción fuera de red

```
Agente: Entendemos que no siempre es fácil encontrar la opción perfecta.
        Aunque Hospital Internacional está fuera de tu red, es la alternativa
        más conveniente considerando su cercanía (12.5 km) y su copago
        estimado de $250. Te recomendamos llamarles antes para confirmar
        costos con tu plan.
```

---

## Equipo

Desarrollado en **HackIAthon** — **21/05/2026**

| Nombre | Rol |
|---|---|
| Carlos Raúl Tingo Borbor - [TingoCarlos08](https://github.com/TingoCarlos08)| Frontend |
| Nahin Isaias Espinoza Ortiz - [nahinespinoza](https://github.com/nahinespinoza)  | Backend |
| Kevin Fernando Maldonado Paredes - [kfmaldon](https://github.com/sirprog)| Agente |

---

## Licencia

MIT — consulta el archivo [LICENSE](LICENSE) para más detalles.

---

<div align="center">
  <p>Construido con ❤️ para mejorar la experiencia del paciente en el sistema de salud</p>
</div>
