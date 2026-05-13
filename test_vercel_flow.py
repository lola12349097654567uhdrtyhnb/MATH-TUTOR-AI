import requests

session = requests.Session()

# 1. Signup
print("Signing up...")
res = session.post("https://math-tutor-ai-qfcs.vercel.app/api/auth/signup", json={"email": "testvercel@test.com", "password": "password123"})
print(res.status_code, res.text)

# 2. Login
print("Logging in...")
res = session.post("https://math-tutor-ai-qfcs.vercel.app/api/auth/login", json={"email": "testvercel@test.com", "password": "password123"})
print(res.status_code, res.text)

# 3. Configure Profile
print("Configuring profile...")
res = session.post("https://math-tutor-ai-qfcs.vercel.app/api/student/configure", json={"preferred_method": "visual", "pacing": "balanced"})
print(res.status_code, res.text)

# 4. Fetch Session
print("Fetching session...")
res = session.get("https://math-tutor-ai-qfcs.vercel.app/api/tutor/session?topic=fractions")
print(res.status_code, res.text)
