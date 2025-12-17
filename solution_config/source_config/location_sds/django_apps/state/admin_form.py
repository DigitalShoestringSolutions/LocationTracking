from django.forms import ModelForm
from django.forms.widgets import TextInput,Widget
from .models import Status


class IconWidget(TextInput):
    template_name = "state/icon.html"
    class Media:
        css = {"all": ["https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css","state/css/dropdown.css"]}
        js = ["state/js/dropdown.js"]

    def get_context(self, name, value, attrs):
        context = super().get_context(name, value, attrs)
        print(context)
        return context


class StatusForm(ModelForm):
    class Meta:
        model = Status
        fields = "__all__"
        widgets = {
            "color": TextInput(attrs={"type": "color"}),
            "icon":IconWidget
        }
