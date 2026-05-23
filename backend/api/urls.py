from django.urls import path
from .views import AgenteCopago, PlanesListView, PatientDetail

urlpatterns = [
    path("agente/", AgenteCopago.as_view(), name="agente-copago"),
    path("planes/", PlanesListView.as_view(), name="planes-list"),
    path("paciente/<str:numero_poliza>/", PatientDetail.as_view(), name="patient-detail"),
]
