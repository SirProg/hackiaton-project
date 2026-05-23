import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from groq import Groq

from insurance.models import InsurancePlan, CopaymentRule
from insurance.serializers import InsurancePlanSerializer
from agent.graph import agent_graph
from agent.nodes.symptom_router import _SYSTEM_PROMPT


def _build_response_message(state: dict, plan_nombre: str) -> str:
    """Genera el mensaje de texto del agente a partir del estado final."""
    if state.get("needs_clarification"):
        return state.get("clarification_question", "¿Puedes describir mejor tu síntoma?")

    specialty = state.get("specialty", "")
    tipo_visita = state.get("tipo_visita", "")
    copago = state.get("copago_amount", 0)
    hospitals = state.get("hospitals", [])
    deductible_met = state.get("deductible_met", False)
    estado_deducible = "deducible cumplido" if deductible_met else "deducible no cumplido"

    if not hospitals:
        return (
            f"Basándome en tus síntomas te recomiendo {specialty}. "
            f"Con tu {plan_nombre} ({estado_deducible}), el copago estimado es ${copago:.0f}. "
            "No encontré hospitales en red para esta especialidad en este momento."
        )

    mejor = hospitals[0]
    intro = (
        f"Basándome en tus síntomas te recomiendo acudir a **{specialty.capitalize()}** "
        f"(visita tipo: {tipo_visita.replace('_', ' ')}). "
        f"Con tu **{plan_nombre}** ({estado_deducible}), "
        f"estas son tus opciones disponibles:"
    )

    if mejor["es_red"]:
        recomendacion = (
            f"🏆 Recomendación: **{mejor['nombre']}** — "
            f"menor copago (${mejor['copago']:.0f}) y "
            f"a solo {mejor['distancia_km']} km de distancia."
        )
    else:
        recomendacion = (
            f"Entendemos que no siempre es fácil encontrar la opción perfecta. "
            f"Aunque **{mejor['nombre']}** está fuera de tu red, "
            f"es la alternativa más conveniente considerando su cercanía "
            f"({mejor['distancia_km']} km) y su copago estimado de ${mejor['copago']:.0f}. "
            f"Te recomendamos llamarles antes para confirmar costos con tu plan."
        )

    return f"{intro}\n\n{recomendacion}"


class AgenteCopago(APIView):
    def post(self, request):
        plan_id = request.data.get("plan_id")
        sintoma = request.data.get("sintoma")
        session_id = request.data.get("session_id", "default")
        deductible_met = bool(request.data.get("deductible_met", False))

        if not plan_id or not sintoma:
            return Response(
                {"error": "Se requieren plan_id y sintoma"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            plan = InsurancePlan.objects.get(pk=plan_id)
        except InsurancePlan.DoesNotExist:
            return Response({"error": "Plan no encontrado"}, status=404)

        initial_state = {
            "messages": [{"role": "user", "content": sintoma}],
            "plan_id": plan.pk,
            "deductible_met": deductible_met,
            "symptom": sintoma,
            "specialty": "",
            "tipo_visita": "",
            "copago_amount": 0.0,
            "hospitals": [],
            "needs_clarification": False,
            "clarification_question": "",
            "error": None,
        }

        config = {"configurable": {"thread_id": session_id}}
        result = agent_graph.invoke(initial_state, config=config)

        mensaje = _build_response_message(result, plan.nombre)

        return Response({
            "mensaje_agente": mensaje,
            "especialidad_sugerida": result.get("specialty", ""),
            "tipo_visita": result.get("tipo_visita", ""),
            "copago_estimado": result.get("copago_amount", 0),
            "needs_clarification": result.get("needs_clarification", False),
            "clarification_question": result.get("clarification_question", ""),
            "opciones": result.get("hospitals", []),
        })


class PlanesListView(APIView):
    def get(self, request):
        planes = InsurancePlan.objects.prefetch_related("copagos").all()
        data = [
            {
                "id": p.pk,
                "nombre": p.nombre,
                "descripcion": p.descripcion,
                "deducible_anual": float(p.deducible_anual),
            }
            for p in planes
        ]
        return Response(data)


class PatientDetail(APIView):
    def get(self, request, numero_poliza):
        from patients.models import Patient
        from patients.serializers import PatientSerializer
        try:
            p = Patient.objects.select_related("plan").get(numero_poliza=numero_poliza)
            return Response(PatientSerializer(p).data)
        except Patient.DoesNotExist:
            return Response({"error": "No encontrado"}, status=404)
