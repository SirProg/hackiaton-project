from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from patients.models import Patient
from patients.serializers import PatientSerializer
from .services import get_specialty_from_symptom, get_copago_options, get_friendly_message

class AgenteCopago(APIView):
    def post(self, request):
        poliza = request.data.get("numero_poliza")
        sintoma = request.data.get("sintoma")

        if not poliza or not sintoma:
            return Response(
                {"error": "Se requieren numero_poliza y sintoma"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            paciente = Patient.objects.select_related("plan").get(numero_poliza=poliza)
        except Patient.DoesNotExist:
            return Response({"error": "Paciente no encontrado"}, status=404)

        especialidad = get_specialty_from_symptom(sintoma)
        specialty_obj, opciones = get_copago_options(paciente, especialidad)

        if not specialty_obj:
            return Response({
                "especialidad_sugerida": especialidad,
                "mensaje": "No encontramos esa especialidad en nuestra red.",
                "opciones": []
            })

        mensaje = get_friendly_message(paciente, sintoma, especialidad, opciones)

        return Response({
            "paciente": paciente.nombre,
            "plan": paciente.plan.nombre,
            "sintoma": sintoma,
            "especialidad_sugerida": especialidad,
            "mensaje_agente": mensaje,
            "opciones": opciones
        })


class PatientDetail(APIView):
    def get(self, request, numero_poliza):
        try:
            p = Patient.objects.select_related("plan").get(numero_poliza=numero_poliza)
            return Response(PatientSerializer(p).data)
        except Patient.DoesNotExist:
            return Response({"error": "No encontrado"}, status=404)