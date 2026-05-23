from django.db import models


TIPO_VISITA_CHOICES = [
    ("medico_general", "Médico General"),
    ("especialista", "Especialista"),
    ("urgencias", "Urgencias"),
    ("laboratorios", "Laboratorios"),
]


class Hospital(models.Model):
    nombre = models.CharField(max_length=200)
    ciudad = models.CharField(max_length=100, blank=True)
    direccion = models.CharField(max_length=300, blank=True)
    es_red = models.BooleanField(default=True)
    distancia_km = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    calificacion = models.DecimalField(max_digits=3, decimal_places=1, default=4.0)
    telefono = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.nombre


class Specialty(models.Model):
    nombre = models.CharField(max_length=150)
    tipo_visita = models.CharField(max_length=20, choices=TIPO_VISITA_CHOICES, default="especialista")
    urgencia = models.CharField(max_length=10, default="media")

    def __str__(self):
        return self.nombre


class HospitalSpecialty(models.Model):
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name="especialidades")
    specialty = models.ForeignKey(Specialty, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("hospital", "specialty")


class InsurancePlan(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    deducible_anual = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fuera_de_red_multiplicador = models.DecimalField(max_digits=4, decimal_places=2, default=2.0)

    def __str__(self):
        return self.nombre


class CopaymentRule(models.Model):
    plan = models.ForeignKey(InsurancePlan, on_delete=models.CASCADE, related_name="copagos")
    tipo_visita = models.CharField(max_length=20, choices=TIPO_VISITA_CHOICES)
    monto_deducible_cumplido = models.DecimalField(max_digits=10, decimal_places=2)
    monto_deducible_no_cumplido = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ("plan", "tipo_visita")

    def __str__(self):
        return f"{self.plan} - {self.tipo_visita}"