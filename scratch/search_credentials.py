import json
import re

log_path = r"C:\Users\Ali Ahmad\.gemini\antigravity\brain\ec2c491b-3152-4d28-9f35-c95294aa35f5\.system_generated\logs\transcript.jsonl"

print("Searching transcript.jsonl for emails and credentials...")

# Regex for email
email_re = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")

with open(log_path, 'r', encoding='utf-8') as f:
    for line_num, line in enumerate(f, 1):
        try:
            data = json.loads(line)
            content = str(data.get("content", "")) + str(data.get("tool_calls", ""))
            
            # Find all emails in content
            emails = email_re.findall(content)
            if emails:
                # Filter out system or local files
                real_emails = [e for e in emails if "local" not in e and "example" not in e]
                if real_emails:
                    print(f"Line {line_num}: Found emails {real_emails}")
            
            # Check for words like "pass" or "password" or "secret" or "smtp"
            if "smtp" in content.lower() or "password" in content.lower():
                print(f"Line {line_num} mentions smtp/password")
        except Exception as e:
            pass
