import json

# The complex fraction questions
complex_fractions = [
    {"content": "Evaluate: 5/6 * (2/3 + 1/4)", "options": ["55/72", "25/36", "5/12", "15/24"], "correct_answer": "55/72"},
    {"content": "Simplify: (3 1/2 - 1 1/4) / 2 1/4", "options": ["1", "2", "3", "4"], "correct_answer": "1"},
    {"content": "Evaluate: 2/3 / 4/9 * 1/2", "options": ["3/4", "1/4", "3/2", "1/2"], "correct_answer": "3/4"},
    {"content": "What is the result of (1/2 + 1/3)^2?", "options": ["25/36", "5/36", "25/6", "1/36"], "correct_answer": "25/36"},
    {"content": "Simplify: 1 / (1 + 1/2)", "options": ["2/3", "3/2", "1", "2"], "correct_answer": "2/3"},
    {"content": "Evaluate: (3/4) / (5/8)", "options": ["6/5", "15/32", "5/6", "32/15"], "correct_answer": "6/5"},
    {"content": "Evaluate: 1/3 * (4/5 - 1/2)", "options": ["1/10", "3/10", "1/5", "3/5"], "correct_answer": "1/10"},
    {"content": "Evaluate: 7/8 / (1/4 + 1/2)", "options": ["7/6", "6/7", "7/4", "4/7"], "correct_answer": "7/6"},
    {"content": "Evaluate: (2/5 * 5/8) + 1/4", "options": ["1/2", "1/4", "3/4", "3/8"], "correct_answer": "1/2"},
    {"content": "Evaluate: 3/4 - (1/2 * 1/3)", "options": ["7/12", "5/12", "1/4", "2/3"], "correct_answer": "7/12"},
    {"content": "Simplify: (2/3)^3", "options": ["8/27", "4/9", "6/9", "8/9"], "correct_answer": "8/27"},
    {"content": "Evaluate: 4/5 / 2/3 * 1/2", "options": ["3/5", "5/3", "2/5", "4/15"], "correct_answer": "3/5"},
    {"content": "Simplify: 2 1/3 * 1 1/2", "options": ["7/2", "3/2", "5/2", "2/3"], "correct_answer": "7/2"},
    {"content": "Evaluate: (5/6 - 1/3) / 1/2", "options": ["1", "1/2", "2", "3/4"], "correct_answer": "1"},
    {"content": "Simplify: 1 - (1/3 + 1/4)", "options": ["5/12", "7/12", "1/12", "1/2"], "correct_answer": "5/12"},
    {"content": "Evaluate: (1/2 / 1/4) - 1", "options": ["1", "2", "0", "1/2"], "correct_answer": "1"},
    {"content": "Simplify: (4/7 * 7/8) / 1/2", "options": ["1", "1/2", "2", "1/4"], "correct_answer": "1"},
    {"content": "Evaluate: 5/8 * (4/5 + 1/2)", "options": ["13/16", "9/16", "5/8", "3/4"], "correct_answer": "13/16"},
    {"content": "Evaluate: (2 1/4) / (3/4)", "options": ["3", "1", "2", "4"], "correct_answer": "3"},
    {"content": "Evaluate: 3/5 + 2/5 * 1/2", "options": ["4/5", "1/2", "1", "3/10"], "correct_answer": "4/5"}
]

# Update questions.json
with open('questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

for q in questions:
    if q.get('subject') == 'fractions' and q.get('difficulty') == 'master':
        # Find which index we are at
        idx = int(q['id'].split('_')[-1]) - 60
        if 0 <= idx < 20:
            q['content'] = complex_fractions[idx]['content']
            q['options'] = complex_fractions[idx]['options']
            q['correct_answer'] = complex_fractions[idx]['correct_answer']
            if 'visual_data' in q:
                del q['visual_data']
            q['hints'] = {
                "step_by_step": "Follow the order of operations: Parentheses first, then exponents, multiplication/division, and finally addition/subtraction.",
                "real_world": "Imagine breaking down a recipe that requires mixing fractions of different ingredients before multiplying the entire batch.",
                "visual": "You can visualize the operations sequentially, combining fractions part by part."
            }

with open('questions.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2)

print("questions.json updated.")
