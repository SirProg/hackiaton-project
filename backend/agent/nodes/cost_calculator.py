from ..state import AgentState


def cost_calculator(state: AgentState) -> AgentState:
    from insurance.models import InsurancePlan, CopaymentRule

    plan_id = state.get("plan_id")
    tipo_visita = state.get("tipo_visita", "medico_general")
    deductible_met = state.get("deductible_met", False)

    try:
        rule = CopaymentRule.objects.get(plan_id=plan_id, tipo_visita=tipo_visita)
        if deductible_met:
            copago = float(rule.monto_deducible_cumplido)
        else:
            copago = float(rule.monto_deducible_no_cumplido)
    except CopaymentRule.DoesNotExist:
        copago = 0.0

    return {**state, "copago_amount": copago}
