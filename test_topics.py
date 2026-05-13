import requests
import json

base_url = "https://math-tutor-ai-qfcs.vercel.app"

# 1. Login to get a valid session
session = requests.Session()
login_payload = {
    "email": "testvercel@test.com",
    "password": "password123"
}
res = session.post(f"{base_url}/api/auth/login", json=login_payload)
print("Login status:", res.status_code)
print("Login response:", res.text)

topics = ["fractions", "geometry", "algebra", "exponents"]

for topic in topics:
    res = session.get(f"{base_url}/api/tutor/session?topic={topic}&_cb=123")
    print(f"\n--- {topic.upper()} ---")
    print("Status:", res.status_code)
    print("Response:", res.text)
