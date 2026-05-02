from django.urls import path
from .views import CreateShareLinkView, PublicShareView

urlpatterns = [
    path('create/<int:report_id>/', CreateShareLinkView.as_view(), name='create_share_link'),
    path('public/<uuid:token>/', PublicShareView.as_view(), name='public_share'),
]
