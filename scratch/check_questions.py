import json
import os

assessment_path = "assessment_questions.json"
practice_path = "questions.json"

def audit_file(file_path):
    print(f"\n================ AUDITING: {file_path} ================")
    if not os.path.exists(file_path):
        print(f"❌ File does not exist: {file_path}")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        try:
            questions = json.load(f)
        except Exception as e:
            print(f"❌ Failed to parse JSON: {e}")
            return

    print(f"Loaded {len(questions)} questions.")
    anomalies_found = 0

    for idx, q in enumerate(questions):
        qid = q.get("id", f"INDEX_{idx}")
        content = q.get("content", "(no content)")
        options = q.get("options", [])
        correct_answer = q.get("correct_answer")

        # 1. Check if correct_answer is missing
        if correct_answer is None:
            print(f"❌ Question '{qid}' is missing 'correct_answer' field entirely!")
            print(f"   Content: {content}")
            anomalies_found += 1
            continue

        # 2. Check if correct_answer is empty string
        if str(correct_answer).strip() == "":
            print(f"❌ Question '{qid}' has an empty or blank 'correct_answer'!")
            print(f"   Content: {content}")
            anomalies_found += 1
            continue

        # 3. Check if options are present
        if not options or not isinstance(options, list):
            print(f"❌ Question '{qid}' has no options or options is not an array!")
            print(f"   Content: {content}")
            anomalies_found += 1
            continue

        # 4. Check if correct_answer exactly matches one of the options
        if correct_answer not in options:
            # Let's check with whitespace trimming
            trimmed_correct = str(correct_answer).strip()
            trimmed_options = [str(o).strip() for o in options]
            if trimmed_correct in trimmed_options:
                print(f"⚠️  Question '{qid}' has correct_answer '{correct_answer}' which matches option with whitespace mismatch.")
                print(f"   Correct: '{correct_answer}' | Options: {options}")
                anomalies_found += 1
            else:
                print(f"❌ Question '{qid}' has correct_answer '{correct_answer}' which does NOT exist in the options list!")
                print(f"   Content: {content}")
                print(f"   Options: {options}")
                anomalies_found += 1

    print(f"Audit completed. Total anomalies/warnings found: {anomalies_found}")

audit_file(assessment_path)
audit_file(practice_path)
