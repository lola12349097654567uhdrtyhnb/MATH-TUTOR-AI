import requests

session = requests.Session()

# 1. Login
res = session.post("https://math-tutor-ai-qfcs.vercel.app/api/auth/login", json={"email": "testvercel@test.com", "password": "password123"})
print("Login status:", res.status_code)

# 2. Configure Profile
res = session.post("https://math-tutor-ai-qfcs.vercel.app/api/student/configure", json={"preferred_method": "visual", "pacing": "balanced"})
print("Configure profile status:", res.status_code)
print("Configure profile text:", res.text)
