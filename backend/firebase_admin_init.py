from dotenv import load_dotenv
import os
from pathlib import Path
import firebase_admin
from firebase_admin import credentials, firestore

load_dotenv()  # load environment variables first

cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
if not cred_path or not Path(cred_path).exists():
    raise FileNotFoundError(f"Firebase credentials not found at {cred_path}")

cred = credentials.Certificate(cred_path)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()
