from django.db import models

class Hospital(models.Model):
    nombre = models.CharField(max_length=200)
    direccion = models.CharField(max_length=300, blank=True)
    es_red = models.BooleanField(default=True)  # Si está en la red del seguro
    
    def __str__(self):
        return self.nombre

class Specialty(models.Model):
    nombre = models.CharField(max_length=150)  # Cardiología, Ginecología, etc.
    
    def __str__(self):
        return self.nombre

class InsurancePlan(models.Model):
    nombre = models.CharField(max_length=100)  # Ej: "Plan Premium", "Plan Básico"
    descripcion = models.TextField(blank=True)
    
    def __str__(self):
        return self.nombre

class CopaymentRule(models.Model):
    plan = models.ForeignKey(InsurancePlan, on_delete=models.CASCADE, related_name="copagos")
    specialty = models.ForeignKey(Specialty, on_delete=models.CASCADE)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, null=True, blank=True)
    porcentaje_copago = models.DecimalField(max_digits=5, decimal_places=2)  # Ej: 20.00
    max_copago = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    def __str__(self):
        return f"{self.plan} - {self.specialty} ({self.porcentaje_copago}%)"