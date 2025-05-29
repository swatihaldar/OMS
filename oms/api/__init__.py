import frappe
from frappe import _

import json
from datetime import datetime


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



# ==================== LOCATION TRACKING APIs ====================

@frappe.whitelist()
def save_user_location(latitude, longitude, accuracy=None, address=None, device_info=None, manual_refresh=False):
    """Save user location to User Location Log doctype with better error handling"""
    try:
        user = frappe.session.user
        
        if user == "Guest":
            return {"success": False, "message": "Authentication required"}
        
        # Validate coordinates
        try:
            lat = float(latitude)
            lng = float(longitude)
            acc = float(accuracy) if accuracy else None
        except (ValueError, TypeError):
            return {"success": False, "message": "Invalid coordinate values"}
        
        # Validate coordinate ranges
        if not (-90 <= lat <= 90):
            return {"success": False, "message": "Latitude must be between -90 and 90"}
        
        if not (-180 <= lng <= 180):
            return {"success": False, "message": "Longitude must be between -180 and 180"}
        
        # Prepare device info (limit to essential data to avoid truncation)
        device_data = {}
        if device_info:
            try:
                full_device_info = json.loads(device_info) if isinstance(device_info, str) else device_info
                # Keep only essential info to avoid field length issues
                device_data = {
                    "browser": full_device_info.get("userAgent", "")[:50],
                    "platform": full_device_info.get("platform", "")[:30],
                    "language": full_device_info.get("language", "")[:10],
                    "timestamp": full_device_info.get("timestamp", "")
                }
            except:
                device_data = {"info": str(device_info)[:100]}
        
        # Create location data for Geolocation field
        location_data = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {
                    "name": f"Location for {user}",
                    "address": address or "",
                    "manual": manual_refresh
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [lng, lat]
                }
            }]
        }
        
        # Create new location log entry
        doc = frappe.get_doc({
            "doctype": "User Location Log",
            "user": user,
            "latitude": lat,
            "longitude": lng,
            "accuracy_meters": acc,
            "address": address,
            "device_info": json.dumps(device_data),
            "manual_refresh": 1 if manual_refresh else 0,
            "location": json.dumps(location_data),
            "timestamp": frappe.utils.now(),
            "session_id": frappe.session.sid,
            "ip_address": frappe.local.request_ip,
        })
        
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
        
        return {
            "success": True, 
            "message": "Location saved successfully",
            "data": {
                "name": doc.name,
                "latitude": doc.latitude,
                "longitude": doc.longitude,
                "timestamp": doc.timestamp,
                "address": doc.address
            }
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Failed to save user location")
        return {"success": False, "message": f"Error saving location: {str(e)}"}


@frappe.whitelist()
def get_user_locations(user_filter=None, limit=50):
    """Get location data for users based on role permissions"""
    try:
        current_user = frappe.session.user
        user_roles = frappe.get_roles(current_user)
        
        # Check if user has permission to view other users' locations
        can_view_all = any(role in ["System Manager", "Location Manager", "Manager"] for role in user_roles)
        
        # Build filters
        filters = {}
        
        if not can_view_all:
            # Regular users can only see their own location
            filters["user"] = current_user
        elif user_filter:
            # Managers can filter by specific user
            filters["user"] = user_filter
        
        # Get latest location for each user
        if can_view_all and not user_filter:
            # Get latest location for each user using SQL
            sql_query = """
                SELECT ul1.* 
                FROM `tabUser Location Log` ul1
                INNER JOIN (
                    SELECT user, MAX(creation) as max_creation
                    FROM `tabUser Location Log`
                    GROUP BY user
                ) ul2 ON ul1.user = ul2.user AND ul1.creation = ul2.max_creation
                ORDER BY ul1.creation DESC
                LIMIT %s
            """
            locations = frappe.db.sql(sql_query, (limit,), as_dict=True)
        else:
            # Get locations for specific user or current user
            locations = frappe.get_all(
                "User Location Log",
                fields=["*"],
                filters=filters,
                order_by="creation desc",
                limit=limit
            )
        
        # Enhance with user details
        enhanced_locations = []
        for location in locations:
            try:
                user_details = frappe.get_value(
                    "User", 
                    location["user"], 
                    ["full_name", "user_image"], 
                    as_dict=True
                ) or {}
                
                # Try to get employee details
                employee_details = frappe.get_value(
                    "Employee",
                    {"user_id": location["user"]},
                    ["employee_name", "designation", "department"],
                    as_dict=True
                ) or {}
                
                enhanced_location = {
                    **location,
                    "full_name": user_details.get("full_name", location["user"]),
                    "user_image": user_details.get("user_image"),
                    "employee_name": employee_details.get("employee_name"),
                    "designation": employee_details.get("designation"),
                    "department": employee_details.get("department"),
                    "time_ago": get_time_ago(location.get("creation") or location.get("timestamp"))
                }
                
                enhanced_locations.append(enhanced_location)
            except Exception as e:
                # If there's an error with user details, still include the location
                location["time_ago"] = get_time_ago(location.get("creation") or location.get("timestamp"))
                enhanced_locations.append(location)
        
        return {
            "success": True, 
            "data": enhanced_locations,
            "can_view_all": can_view_all
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Failed to get user locations")
        return {"success": False, "message": str(e)}


@frappe.whitelist()
def get_location_history(user_id=None, from_date=None, to_date=None, limit=100):
    """Get location history for a user"""
    try:
        current_user = frappe.session.user
        user_roles = frappe.get_roles(current_user)
        
        # Check permissions
        can_view_all = any(role in ["System Manager", "Location Manager", "Manager"] for role in user_roles)
        
        target_user = user_id or current_user
        
        if not can_view_all and target_user != current_user:
            return {"success": False, "message": "Insufficient permissions"}
        
        # Build filters
        filters = {"user": target_user}
        
        if from_date:
            filters["creation"] = [">=", from_date]
        if to_date:
            if "creation" in filters:
                filters["creation"] = ["between", [from_date, to_date]]
            else:
                filters["creation"] = ["<=", to_date]
        
        # Get location history
        history = frappe.get_all(
            "User Location Log",
            fields=["*"],
            filters=filters,
            order_by="creation desc",
            limit=int(limit)
        )
        
        # Add time ago for each entry
        for entry in history:
            entry["time_ago"] = get_time_ago(entry.get("creation") or entry.get("timestamp"))
        
        return {"success": True, "data": history}
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Failed to get location history")
        return {"success": False, "message": str(e)}


@frappe.whitelist()
def get_all_users_for_tracking():
    """Get list of all users for location tracking (managers only)"""
    try:
        current_user = frappe.session.user
        user_roles = frappe.get_roles(current_user)
        
        # Check permissions
        if not any(role in ["System Manager", "Location Manager", "Manager"] for role in user_roles):
            return {"success": False, "message": "Insufficient permissions"}
        
        # Get all users with employee records
        users = frappe.db.sql("""
            SELECT 
                u.name as user_id,
                u.full_name,
                u.user_image,
                e.employee_name,
                e.designation,
                e.department
            FROM `tabUser` u
            LEFT JOIN `tabEmployee` e ON e.user_id = u.name
            WHERE u.enabled = 1 
            AND u.name != 'Guest'
            AND u.name != 'Administrator'
            ORDER BY u.full_name
        """, as_dict=True)
        
        return {"success": True, "data": users}
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Failed to get users for tracking")
        return {"success": False, "message": str(e)}


@frappe.whitelist()
def get_my_last_location():
    """Get the last saved location for current user"""
    try:
        user = frappe.session.user
        
        if user == "Guest":
            return {"success": False, "message": "Authentication required"}
        
        # Get the latest location for current user
        last_location = frappe.get_all(
            "User Location Log",
            fields=["*"],
            filters={"user": user},
            order_by="creation desc",
            limit=1
        )
        
        if last_location:
            location_data = last_location[0]
            location_data["time_ago"] = get_time_ago(location_data.get("creation"))
            return {"success": True, "data": location_data}
        else:
            return {"success": False, "message": "No location data found"}
            
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Failed to get last location")
        return {"success": False, "message": str(e)}


@frappe.whitelist()
def get_current_user_info():
    """Get current user information including roles"""
    try:
        user = frappe.session.user
        
        if user == "Guest":
            return {"success": False, "message": "Authentication required"}
        
        # Get user details
        user_doc = frappe.get_doc("User", user)
        
        # Get user roles
        roles = frappe.get_roles(user)
        
        # Get employee details if available
        employee = None
        department = None
        designation = None
        
        try:
            employee_list = frappe.get_all("Employee", 
                                         filters={"user_id": user}, 
                                         fields=["name", "department", "designation"])
            if employee_list:
                employee = employee_list[0].name
                department = employee_list[0].department
                designation = employee_list[0].designation
        except:
            pass
        
        return {
            "user_id": user,
            "full_name": user_doc.full_name,
            "email": user_doc.email,
            "user_image": user_doc.user_image,
            "roles": roles,
            "employee": employee,
            "department": department,
            "designation": designation
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Failed to get user info")
        return {"success": False, "message": str(e)}


def get_time_ago(timestamp):
    """Calculate time ago from timestamp"""
    try:
        from datetime import datetime
        import frappe.utils
        
        if not timestamp:
            return "Unknown"
        
        now = frappe.utils.now_datetime()
        created = frappe.utils.get_datetime(timestamp)
        diff = now - created
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"
    except:
        return "Unknown"
