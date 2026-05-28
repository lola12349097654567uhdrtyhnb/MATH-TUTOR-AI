import json

with open("assessment_questions.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

print(f"Total questions in assessment_questions.json: {len(questions)}")
for idx, q in enumerate(questions):
    print(f"\n[{idx}] ID: {q.get('id')} ({q.get('subject')} - {q.get('difficulty')})")
    print(f"    Content: {q.get('content')}")
    print(f"    Options: {q.get('options')}")
    print(f"    Correct Answer: '{q.get('correct_answer')}'")
