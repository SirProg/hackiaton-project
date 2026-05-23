from django.contrib import admin

# Register your models here.
# insurance/admin.py
from django.contrib import admin
from .models import Hospital, Specialty, InsurancePlan, CopaymentRule

admin.site.register(Hospital)
admin.site.register(Specialty)
admin.site.register(InsurancePlan)
admin.site.register(CopaymentRule)