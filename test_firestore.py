from backend.firebase_admin_init import db

print("Before Firestore")
doc = db.collection("agents").limit(1).get()
print("After Firestore", doc)
