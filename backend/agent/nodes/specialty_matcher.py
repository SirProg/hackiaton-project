import django
from ..state import AgentState


def specialty_matcher(state: AgentState) -> AgentState:
    from insurance.models import Specialty

    specialty_name = state.get("specialty", "medicina_general")

    try:
        specialty = Specialty.objects.get(nombre__iexact=specialty_name)
        return {
            **state,
            "specialty": specialty.nombre,
            "tipo_visita": specialty.tipo_visita,
        }
    except Specialty.DoesNotExist:
        # Fallback a medicina_general
        try:
            fallback = Specialty.objects.get(nombre="medicina_general")
            return {
                **state,
                "specialty": fallback.nombre,
                "tipo_visita": fallback.tipo_visita,
            }
        except Specialty.DoesNotExist:
            return {**state, "tipo_visita": "medico_general"}
