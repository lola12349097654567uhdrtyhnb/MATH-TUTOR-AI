import json

log_path = r"C:\Users\Ali Ahmad\.gemini\antigravity\brain\ec2c491b-3152-4d28-9f35-c95294aa35f5\.system_generated\logs\transcript.jsonl"

print("Searching all USER_INPUT in transcript.jsonl...")

with open(log_path, 'r', encoding='utf-8') as f:
    for line_num, line in enumerate(f, 1):
        try:
            data = json.loads(line)
            if data.get("type") == "USER_INPUT":
                print(f"\n--- Line {line_num} (USER) ---")
                print(data.get("content", ""))
        except Exception as e:
            pass
