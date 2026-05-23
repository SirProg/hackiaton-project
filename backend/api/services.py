import os
from groq import Groq
from insurance.models import CopaymentRule, Specialty
from .prompts import symptom_to_specialty_prompt, friendly_message_prompt

MODEL = "llama-3.1-8b-instant"

def _get_client():
    return Groq(api_key=os.getenv("GROQ_API_KEY"))

def _chat(prompt: str, max_tokens: int = 300) -> str:
    response = _get_client().chat.completions.create(
        model=MODEL,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content.strip()


def get_specialty_from_symptom(symptom: str) -> str:
    specialties = list(Specialty.objects.values_list("nombre", flat=True))
    prompt = symptom_to_specialty_prompt(symptom, specialties)
    return _chat(prompt, max_tokens=20)


def get_copago_options(paciente, especialidad_nombre: str) -> tuple[object | None, list[dict]]:
    """Retorna (specialty_obj, lista de opciones ordenadas por copago)"""
    try:
        specialty = Specialty.objects.get(nombre__iexact=especialidad_nombre)
    except Specialty.DoesNotExist:
        return None, []

    reglas = CopaymentRule.objects.filter(
        plan=paciente.plan,
        specialty=specialty,
        hospital__es_red=True,
        hospital__isnull=False
    ).select_related("hospital").order_by("porcentaje_copago")

    opciones = [
        {
            "hospital": r.hospital.nombre,
            "direccion": r.hospital.direccion,
            "porcentaje_copago": float(r.porcentaje_copago),
            "max_copago": float(r.max_copago) if r.max_copago else None,
        }
        for r in reglas
    ]
    return specialty, opciones


def get_friendly_message(paciente, sintoma: str, especialidad: str, opciones: list[dict]) -> str:
    resumen = "\n".join(
        [f"- {o['hospital']}: {o['porcentaje_copago']}% copago" for o in opciones]
    ) or "No hay hospitales en red disponibles."

    prompt = friendly_message_prompt(
        paciente.nombre, paciente.plan.nombre, sintoma, especialidad, resumen
    )
    return _chat(prompt)