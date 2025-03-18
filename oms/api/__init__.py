import frappe
from frappe import _

@frappe.whitelist()
def get_current_user_info() -> dict:
	current_user = frappe.session.user
	user = frappe.db.get_value(
		"User", current_user, ["name", "first_name", "full_name", "user_image"], as_dict=True
	)
	user["roles"] = frappe.get_roles(current_user)

	return user


@frappe.whitelist()
def get_employee_details():
    """Fetch Employee details for the logged-in user"""
    current_user = frappe.session.user

    employee = frappe.db.get_value(
        "Employee", 
        {"user_id": current_user},
        ["name", "employee_name", "designation", "department", "company"], 
        as_dict=True
    )

    if not employee:
        frappe.throw("Employee record not found for the logged-in user", frappe.DoesNotExistError)

    return employee



@frappe.whitelist()
def get_doctype_fields(doctype):
    """
    Get all fields for a doctype
    """
    try:
        # Get doctype fields
        meta = frappe.get_meta(doctype)
        fields = meta.fields

        
        # Convert to list of dicts for easier handling in frontend
        field_list = []
        for field in fields:
            if field.fieldname in ['naming_series', 'amended_from']:
                continue
                
            field_dict = {
                "fieldname": field.fieldname,
                "fieldtype": field.fieldtype,
                "label": field.label,
                "reqd": field.reqd,
                "hidden": field.hidden,
                "read_only": field.read_only,
                "options": field.options,
                "default": field.default,
                "description": field.description,
                "idx": field.idx
            }
            field_list.append(field_dict)
        
        return field_list
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Error in get_doctype_fields"))
        return {"error": str(e)}

@frappe.whitelist()
def get_link_options(doctype, fields=None):
    """
    Get options for Link fields
    """
    try:
        if not fields:
            fields = ["name"]
        
        # Get list of documents
        docs = frappe.get_list(doctype, fields=fields, limit=50)
        
        return docs
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Error in get_link_options"))
        return {"error": str(e)}



