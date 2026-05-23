from rest_framework import serializers
from .models import Hospital, Specialty, InsurancePlan, CopaymentRule


class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = '__all__'


class SpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialty
        fields = '__all__'


class CopaymentRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CopaymentRule
        fields = '__all__'


class InsurancePlanSerializer(serializers.ModelSerializer):
    copagos = CopaymentRuleSerializer(many=True, read_only=True)

    class Meta:
        model = InsurancePlan
        fields = ['id', 'nombre', 'descripcion', 'deducible_anual', 'fuera_de_red_multiplicador', 'copagos']