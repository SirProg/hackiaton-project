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
    hospital = HospitalSerializer()
    specialty = SpecialtySerializer()

    class Meta:
        model = CopaymentRule
        fields = '__all__'