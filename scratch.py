import requests
import json
import uuid

def run_test():
    s = requests.Session()
    
    with open('questions.json', 'r') as f:
        questions = json.load(f)
    question_dict = {q['id']: q for q in questions}

    username = str(uuid.uuid4())
    print("User:", username)
    
    r = s.post('http://127.0.0.1:5000/signup', data={'username': username, 'password': 'pw'})
    r = s.post('http://127.0.0.1:5000/login', data={'username': username, 'password': 'pw'})
    print("Login:", r.status_code)
    
    r = s.post('http://127.0.0.1:5000/configure_student', json={})
    data = r.json()
    
    # Complete diagnostics
    for _ in range(3):
        q_id = data.get('diagnostic_question', {}).get('id', 'q_easy_0')
        r = s.post('http://127.0.0.1:5000/submit_diagnostic', json={'question_id': q_id, 'answer': '1/1'})
        data = r.json()
    
    print("Diagnostics done.")
    
    r = s.post('http://127.0.0.1:5000/mark_topic_intro_seen', json={'topic': 'fractions'})
    data = r.json()
    next_action = data.get('next_action')
    
    for i in range(1, 7):
        print(f"\n--- Question {i} ---")
        print("Action:", next_action)
        if not next_action:
            break
            
        if next_action['type'] == 'upload_work':
            print("Received upload work prompt!")
            break
            
        q_id = next_action['id']
        correct = question_dict[q_id]['correct_answer']
        print(f"Answering {q_id} with {correct}")
        
        r = s.post('http://127.0.0.1:5000/submit_answer', json={'question_id': q_id, 'answer': correct})
        data = r.json()
        print("Submit answer response:", data)
        next_action = data.get('next_action')

run_test()
