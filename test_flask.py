import requests
import json

url = "http://127.0.0.1:5000/api/configure_student"

payload = {
    "topic": "fractions",
    "profile_data": {
        "preferred_method": "visual"
    },
    "user_data": {
        "learning_profile": {"preferred_method": "visual"},
        "brain_state_fractions": {}
    }
}

res = requests.post(url, json=payload)
print("FRACTIONS Status:", res.status_code)
print("Response:", res.text)

payload["topic"] = "exponents"
res = requests.post(url, json=payload)
print("\nEXPONENTS Status:", res.status_code)
print("Response:", res.text)
