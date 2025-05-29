# Copyright (c) 2025, HnS and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
import json
from datetime import datetime


class UserLocationLog(Document):
    def before_insert(self):
        """Set timestamp and session info before inserting"""
        self.timestamp = frappe.utils.now()
        self.session_id = frappe.session.sid
        self.ip_address = frappe.local.request_ip
        
        # Ensure geolocation field is properly formatted
        if self.latitude and self.longitude:
            self.set_geolocation_field()
    
    def before_save(self):
        """Update geolocation field before saving"""
        if self.latitude and self.longitude:
            self.set_geolocation_field()
    
    def set_geolocation_field(self):
        """Set the geolocation field with proper GeoJSON format"""
        try:
            location_data = {
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "properties": {
                        "name": f"Location for {self.user}",
                        "address": self.address or "",
                        "timestamp": str(self.timestamp or frappe.utils.now())
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [float(self.longitude), float(self.latitude)]
                    }
                }]
            }
            self.location = json.dumps(location_data)
        except Exception as e:
            frappe.log_error(f"Error setting geolocation field: {str(e)}", "User Location Log")
    
    def validate(self):
        """Validate the document before saving"""
        if not self.user:
            frappe.throw("User is required")
        
        if not self.latitude or not self.longitude:
            frappe.throw("Latitude and Longitude are required")
        
        # Validate coordinate ranges
        if not (-90 <= float(self.latitude) <= 90):
            frappe.throw("Latitude must be between -90 and 90")
        
        if not (-180 <= float(self.longitude) <= 180):
            frappe.throw("Longitude must be between -180 and 180")
