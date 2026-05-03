import requests
import json

data = {
    "user_data": {
        "brain_state_fractions": {
            "diagnostic_questions": []
        }
    },
    "profile_data": {},
    "topic": "fractions"
}

try:
    res = requests.post("http://localhost:5000/api/configure_student", json=data)
    out = res.json()
    print("diagnostic_questions length:", len(out.get('diagnostic_questions', [])))
    print("response preview:", str(out)[:200])
except Exception as e:
    print("Failed to reach flask:", e)
