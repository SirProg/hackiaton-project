from django.db import models
from insurance.models import InsurancePlan

class Patient(models.Model):
    nombre = models.CharField(max_length=150)
    numero_poliza = models.CharField(max_length=50, unique=True)
    edad = models.IntegerField()
    plan = models.ForeignKey(InsurancePlan, on_delete=models.PROTECT)
    
    def __str__(self):
        return f"{self.nombre} - {self.numero_poliza}"