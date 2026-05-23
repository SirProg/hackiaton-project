from django.contrib import admin
from .models import Hospital, Specialty, InsurancePlan, CopaymentRule, HospitalSpecialty

admin.site.register(Hospital)
admin.site.register(Specialty)
admin.site.register(InsurancePlan)
admin.site.register(CopaymentRule)
admin.site.register(HospitalSpecialty)