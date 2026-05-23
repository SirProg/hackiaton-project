from django.urls import path
from .views import AgenteCopago, PatientDetail

urlpatterns = [
    path("agente/", AgenteCopago.as_view(), name="agente-copago"),
    path("paciente/<str:numero_poliza>/", PatientDetail.as_view(), name="patient-detail"),
]
