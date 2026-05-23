from ..state import AgentState, HospitalResult


def hospital_ranker(state: AgentState) -> AgentState:
    from insurance.models import Hospital, HospitalSpecialty, InsurancePlan, CopaymentRule

    specialty_name = state.get("specialty", "medicina_general")
    tipo_visita = state.get("tipo_visita", "medico_general")
    plan_id = state.get("plan_id")
    deductible_met = state.get("deductible_met", False)

    try:
        plan = InsurancePlan.objects.get(pk=plan_id)
        fuera_de_red_mult = float(plan.fuera_de_red_multiplicador)
    except InsurancePlan.DoesNotExist:
        fuera_de_red_mult = 2.0

    try:
        rule = CopaymentRule.objects.get(plan_id=plan_id, tipo_visita=tipo_visita)
        base_copago = float(rule.monto_deducible_cumplido if deductible_met else rule.monto_deducible_no_cumplido)
    except CopaymentRule.DoesNotExist:
        base_copago = 0.0

    hospital_ids = HospitalSpecialty.objects.filter(
        specialty__nombre__iexact=specialty_name
    ).values_list("hospital_id", flat=True)

    hospitals_qs = Hospital.objects.filter(pk__in=hospital_ids).order_by("distancia_km")

    results: list[HospitalResult] = []
    for h in hospitals_qs[:5]:
        copago = base_copago if h.es_red else round(base_copago * fuera_de_red_mult, 2)
        results.append({
            "id": h.pk,
            "nombre": h.nombre,
            "ciudad": h.ciudad,
            "distancia_km": float(h.distancia_km),
            "calificacion": float(h.calificacion),
            "telefono": h.telefono,
            "es_red": h.es_red,
            "especialidad": specialty_name,
            "tipo_visita": tipo_visita,
            "copago": copago,
        })

    results.sort(key=lambda x: (x["copago"], x["distancia_km"]))

    return {**state, "hospitals": results[:3]}
