# oms.py
import frappe
import os
from frappe.website.utils import get_html_content_based_on_type

def get_context(context):
    context.no_cache = 1
    context.no_sidebar = 1
    context.no_breadcrumbs = 1
    
    html_content = get_html_content_based_on_type(
        app_path="public/oms/index.html",
        basepath=frappe.get_app_path("your_app_name", "public", "oms"),
        start_tags="<!--start-->",
        end_tags="<!--end-->",
    )
    
    context.content = html_content
    return context