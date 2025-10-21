from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PagoViewSet

router = DefaultRouter()
router.register(r'pagos', PagoViewSet, basename='pagos')

urlpatterns = [
    path('', include(router.urls)),
]


# ========================================
# ARCHIVO 7: backend/pagos/admin.py
# ========================================
from django.contrib import admin
from django.utils.html import format_html
from .models import Pago


@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'usuario',
        'monto_display',
        'metodo_pago',
        'estado_display',
        'fecha_creacion'
    ]
    
    list_filter = [
        'estado',
        'metodo_pago',
        'fecha_creacion'
    ]
    
    search_fields = [
        'usuario__username',
        'usuario__email',
        'descripcion',
        'stripe_payment_intent_id'
    ]
    
    readonly_fields = [
        'fecha_creacion',
        'fecha_completado',
        'fecha_cancelado',
        'stripe_payment_intent_id',
        'stripe_charge_id'
    ]
    
    fieldsets = [
        ('Información del Pago', {
            'fields': [
                'usuario',
                'monto',
                'metodo_pago',
                'estado',
                'descripcion'
            ]
        }),
        ('Información de Stripe', {
            'fields': [
                'stripe_payment_intent_id',
                'stripe_charge_id'
            ],
            'classes': ['collapse']
        }),
        ('Fechas', {
            'fields': [
                'fecha_creacion',
                'fecha_completado',
                'fecha_cancelado'
            ]
        })
    ]
    
    def monto_display(self, obj):
        """Mostrar monto formateado"""
        return f"${obj.monto:.2f}"
    monto_display.short_description = "Monto"
    monto_display.admin_order_field = "monto"
    
    def estado_display(self, obj):
        """Mostrar estado con colores"""
        colors = {
            'completado': 'green',
            'procesando': 'orange',
            'pendiente': 'gray',
            'cancelado': 'red',
            'fallido': 'darkred'
        }
        color = colors.get(obj.estado, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_display.short_description = "Estado"
    estado_display.admin_order_field = "estado"