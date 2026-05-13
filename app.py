from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from tutor import BKTPomdpBrain
from ai_grader import grade_scratchpad
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from Vercel

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

def load_brain_from_user_state(user_data, topic='fractions'):
    brain = BKTPomdpBrain(topic=topic)
    profile_updates = user_data.get('learning_profile', {})
    if profile_updates:
        brain.learning_profile.update(profile_updates)
    brain._apply_profile()
    
    state = user_data.get(f'brain_state_{topic}', {})
    if state:
        brain.belief = state.get('belief', brain.belief)
        brain.p_guess = state.get('p_guess', brain.p_guess)
        brain.p_slip = state.get('p_slip', brain.p_slip)
        brain.p_transit = state.get('p_transit', brain.p_transit)
        brain.mastery_bias = state.get('mastery_bias', brain.mastery_bias)
        
    return brain

def extract_brain_state(brain):
    return {
        'belief': brain.belief,
        'p_guess': brain.p_guess,
        'p_slip': brain.p_slip,
        'p_transit': brain.p_transit,
        'mastery_bias': brain.mastery_bias,
        'learning_profile': brain.learning_profile,
        'diagnostic_questions': brain.diagnostic_questions,
    }

@app.route('/api/configure_student', methods=['POST'])
def configure_student():
    data = request.json or {}
    user_data = data.get('user_data', {})
    profile_data = data.get('profile_data', {})
    topic = data.get('topic', 'fractions')
    
    brain = load_brain_from_user_state(user_data, topic)
    brain.configure_profile(profile_data)
    
    return jsonify({
        'brain_state': extract_brain_state(brain),
        'diagnostic_questions': brain.diagnostic_questions
    })

@app.route('/api/submit_diagnostic', methods=['POST'])
def submit_diagnostic():
    data = request.json or {}
    user_data = data.get('user_data', {})
    question_id = data.get('question_id')
    student_answer = data.get('answer', '')
    topic = data.get('topic', 'fractions')
    
    brain = load_brain_from_user_state(user_data, topic)
    is_correct = brain.check_diagnostic_answer(question_id, student_answer)
    
    return jsonify({
        'is_correct': is_correct,
        'brain_state': extract_brain_state(brain)
    })

@app.route('/api/get_next_action', methods=['POST'])
def get_next_action():
    data = request.json or {}
    user_data = data.get('user_data', {})
    topic = data.get('topic', 'fractions')
    seen = data.get('seen_questions', [])
    
    brain = load_brain_from_user_state(user_data, topic)
    next_action = brain.get_pomdp_action(seen)
    return jsonify({'next_action': next_action})

@app.route('/api/submit_answer', methods=['POST'])
@limiter.limit("30 per minute")
def submit_answer():
    data = request.json or {}
    user_data = data.get('user_data', {})
    topic = data.get('topic', 'fractions')
    question_id = data.get('question_id')
    student_answer = data.get('answer', '')
    response_time = data.get('response_time_seconds')
    hint_used = data.get('hint_used', False)
    attempt_count = data.get('attempt_count', 1)
    
    brain = load_brain_from_user_state(user_data, topic)
    is_correct = brain.check_answer(question_id, student_answer)
    
    new_score = brain.update_bkt(
        is_correct, response_time, student_answer, 
        hint_used=hint_used, attempt_count=attempt_count
    )
    
    return jsonify({
        'is_correct': is_correct,
        'mastery': round(new_score, 2),
        'brain_state': extract_brain_state(brain)
    })

@app.route('/api/get_hint', methods=['POST'])
@limiter.limit("30 per minute")
def get_hint():
    data = request.json or {}
    user_data = data.get('user_data', {})
    topic = data.get('topic', 'fractions')
    question_id = data.get('question_id')
    
    brain = load_brain_from_user_state(user_data, topic)
    hint = brain.get_hint(question_id)
    return jsonify({'hint': hint})

@app.route('/api/upload_work', methods=['POST'])
@limiter.limit("5 per minute")
def upload_work():
    data = request.json or {}
    base64_string = data.get('base64_image')
    question_text = data.get('question_text', 'Fraction problem')
    user_data = data.get('user_data', {})
    topic = data.get('topic', 'fractions')

    if not base64_string:
        return jsonify({'error': 'No image provided'}), 400

    grade_result = grade_scratchpad(base64_string, question_text, topic)
    is_valid_math = grade_result.get("is_valid", False)
    
    brain = load_brain_from_user_state(user_data, topic)
    if is_valid_math:
        brain.belief = min(brain.belief + 0.10, 0.99)
    else:
        brain.belief = max(brain.belief - 0.35, 0.01)

    return jsonify({
        'is_valid_math': is_valid_math,
        'feedback': grade_result.get("feedback", ""),
        'sub_topic': grade_result.get("sub_topic", "default"),
        'brain_state': extract_brain_state(brain)
    })

@app.route('/api/get_assessment_questions', methods=['POST'])
def get_assessment_questions():
    data = request.json or {}
    topics = data.get('topics', [])
    exclude_ids = data.get('exclude_ids', [])
    count_per_topic = data.get('count_per_topic', 5)
    
    questions_path = os.path.join(os.path.dirname(__file__), 'assessment_questions.json')
    if not os.path.exists(questions_path):
        return jsonify({'error': 'Assessment questions bank not found'}), 404
        
    import json, random
    with open(questions_path, 'r', encoding='utf-8') as f:
        all_qs = json.load(f)
        
    selected_questions = []
    for t in topics:
        topic_qs = [q for q in all_qs if q.get('subject') == t and q.get('id') not in exclude_ids]
        random.shuffle(topic_qs)
        selected_questions.extend(topic_qs[:count_per_topic])
        
    return jsonify({'questions': selected_questions})

if __name__ == '__main__':
    app.run(port=5000, debug=True)
