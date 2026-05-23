from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from .state import AgentState
from .nodes.symptom_router import symptom_router
from .nodes.specialty_matcher import specialty_matcher
from .nodes.cost_calculator import cost_calculator
from .nodes.hospital_ranker import hospital_ranker


def _should_clarify(state: AgentState) -> str:
    return "end" if state.get("needs_clarification") else "specialty_matcher"


def build_graph():
    builder = StateGraph(AgentState)

    builder.add_node("symptom_router", symptom_router)
    builder.add_node("specialty_matcher", specialty_matcher)
    builder.add_node("cost_calculator", cost_calculator)
    builder.add_node("hospital_ranker", hospital_ranker)

    builder.set_entry_point("symptom_router")

    builder.add_conditional_edges(
        "symptom_router",
        _should_clarify,
        {"end": END, "specialty_matcher": "specialty_matcher"},
    )

    builder.add_edge("specialty_matcher", "cost_calculator")
    builder.add_edge("cost_calculator", "hospital_ranker")
    builder.add_edge("hospital_ranker", END)

    memory = MemorySaver()
    return builder.compile(checkpointer=memory)


# Singleton del grafo — se instancia una vez al arrancar Django
agent_graph = build_graph()
