# oms.py
import frappe
import os

def get_context(context):
    context.no_cache = 1
    context.no_sidebar = 1
    context.no_breadcrumbs = 1

    vue_index_path = frappe.get_app_path("oms", "public", "oms", "index.html")

    if os.path.exists(vue_index_path):
        with open(vue_index_path, "r") as f:
            context.content = f.read()
    else:
        context.content = "<h1>Vue frontend not found. Run `npm run build` in the frontend folder.</h1>"

    return context
