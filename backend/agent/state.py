from typing import TypedDict, Optional


class HospitalResult(TypedDict):
    id: int
    nombre: str
    ciudad: str
    distancia_km: float
    calificacion: float
    telefono: str
    es_red: bool
    especialidad: str
    tipo_visita: str
    copago: float


class AgentState(TypedDict):
    messages: list[dict]
    plan_id: int
    deductible_met: bool
    symptom: str
    specialty: str
    tipo_visita: str
    copago_amount: float
    hospitals: list[HospitalResult]
    needs_clarification: bool
    clarification_question: str
    error: Optional[str]
