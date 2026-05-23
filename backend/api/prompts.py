def symptom_to_specialty_prompt(symptom: str, specialties: list[str]) -> str:
    return (
        f"El paciente tiene este síntoma: '{symptom}'.\n"
        f"Especialidades disponibles: {', '.join(specialties)}.\n"
        "Responde SOLO con el nombre exacto de la especialidad. Sin explicación."
    )

def friendly_message_prompt(nombre, plan, sintoma, especialidad, resumen_opciones) -> str:
    return (
        f"Paciente: {nombre}, plan: {plan}. "
        f"Síntoma: '{sintoma}', necesita: {especialidad}.\n"
        f"Opciones disponibles:\n{resumen_opciones}\n"
        "Escribe un mensaje corto y amigable (máximo 3 oraciones) explicando "
        "las opciones y recomendando la más económica."
    )