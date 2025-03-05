import frappe

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