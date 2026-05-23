import os
import json
from groq import Groq
from ..state import AgentState

_SPECIALTIES = [
    "cardiologia", "neurologia", "ortopedia", "pediatria", "dermatologia",
    "medicina_general", "endocrinologia", "neumologia", "urgencias", "laboratorios",
]

_SYSTEM_PROMPT = """Eres un clasificador médico. Dado un síntoma en español, debes:
1. Determinar si el síntoma es claro o ambiguo.
2. Si es claro, devolver la especialidad médica apropiada de la lista dada.
3. Si es ambiguo (por ejemplo "me duele la cabeza" sin más detalle), devolver una pregunta aclaratoria corta.

Responde SOLO con JSON válido, sin texto extra:
- Si el síntoma es claro: {"needs_clarification": false, "specialty": "<nombre_especialidad>"}
- Si es ambiguo: {"needs_clarification": true, "clarification_question": "<pregunta corta>"}

Especialidades disponibles: cardiologia, neurologia, ortopedia, pediatria, dermatologia,
medicina_general, endocrinologia, neumologia, urgencias, laboratorios.

Reglas:
- Dolor en pecho / dificultad para respirar grave → cardiologia (urgencias)
- Migraña con aura, convulsiones, entumecimiento → neurologia
- Dolor de rodilla/cadera/espalda con lesión → ortopedia
- Fiebre/tos en niños menores → pediatria
- Manchas, erupciones, picazón en piel → dermatologia
- Fiebre leve, resfriado, chequeo general → medicina_general
- Glucosa alta, tiroides → endocrinologia
- Asma, tos crónica → neumologia
- Emergencia grave, accidente → urgencias
- Análisis de sangre/orina → laboratorios
- "me duele la cabeza" sin detalles → AMBIGUO, preguntar intensidad/tipo"""


def symptom_router(state: AgentState) -> AgentState:
    symptom = state["symptom"]
    history = state.get("messages", [])

    messages = [{"role": "system", "content": _SYSTEM_PROMPT}]
    for msg in history[:-1]:
        messages.append(msg)
    messages.append({"role": "user", "content": f"Síntoma: {symptom}"})

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        max_tokens=150,
        temperature=0.1,
    )

    raw = response.choices[0].message.content.strip()

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        # Fallback: buscar la especialidad mencionada en la respuesta
        found = next((s for s in _SPECIALTIES if s in raw.lower()), "medicina_general")
        result = {"needs_clarification": False, "specialty": found}

    if result.get("needs_clarification"):
        return {
            **state,
            "needs_clarification": True,
            "clarification_question": result.get("clarification_question", "¿Puedes describir mejor tu síntoma?"),
        }

    return {
        **state,
        "needs_clarification": False,
        "specialty": result.get("specialty", "medicina_general"),
        "clarification_question": "",
    }
