from pathlib import Path
import firebase_admin
from firebase_admin import credentials, firestore

# Resolve project root (one directory above backend/)
ROOT_DIR = Path(__file__).resolve().parent.parent

# Path to firebase/serviceaccount.json
cred_path = ROOT_DIR / "firebase" / "serviceaccount.json"

if not cred_path.exists():
    raise FileNotFoundError(f"Firebase credentials not found at {cred_path}")

cred = credentials.Certificate(str(cred_path))

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()
