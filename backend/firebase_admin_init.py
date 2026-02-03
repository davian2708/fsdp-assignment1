# backend/firebase_admin_init.py
import firebase_admin
from firebase_admin import firestore

# Initialize Firebase ONLY ONCE
if not firebase_admin._apps:
    firebase_admin.initialize_app()

# Firestore client (global, reused)
db = firestore.client()
