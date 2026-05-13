import json
import random
import math

questions = []

def add_questions(level, count):
    # FRACTIONS
    for _ in range(count):
        if level == "easy":
            # Addition/subtraction with different denominators
            d1 = random.choice([2, 3, 4, 5])
            d2 = random.choice([2, 3, 4, 5])
            while d1 == d2: d2 = random.choice([2, 3, 4, 5])
            common_d = d1 * d2
            n1 = random.randint(1, d1-1)
            n2 = random.randint(1, d2-1)
            ans_n = n1 * d2 + n2 * d1
            content = f"What is {n1}/{d1} + {n2}/{d2}?"
            ans = f"{ans_n}/{common_d}"
            
            wrong1 = f"{n1+n2}/{d1+d2}"
            wrong2 = f"{ans_n+1}/{common_d}"
            wrong3 = f"{abs(ans_n-1)}/{common_d}"
            
            options = list(set([ans, wrong1, wrong2, wrong3]))
            while len(options) < 4:
                options.append(f"{random.randint(1,20)}/{common_d}")
                options = list(set(options))
            random.shuffle(options)
            
            questions.append({
                "id": f"q_easy_{len(questions)}",
                "content": content,
                "options": options[:4],
                "correct_answer": ans,
                "difficulty": "easy",
                "subject": "fractions",
                "hints": {
                    "step_by_step": f"Find a common denominator by multiplying {d1} and {d2} to get {common_d}.",
                    "real_world": f"To combine slices from a pizza cut into {d1} pieces with one cut into {d2} pieces, we recut them both into {common_d} total slices.",
                    "visual": f"Imagine splitting the {d1}-part circle explicitly into {common_d} parts, doing the same for the {d2}-part circle, then adding."
                }
            })
            
        elif level == "medium":
            # Multiplication of fractions
            d1 = random.randint(2, 6)
            d2 = random.randint(2, 6)
            n1 = random.randint(1, d1-1)
            n2 = random.randint(1, d2-1)
            
            content = f"What is {n1}/{d1} * {n2}/{d2}?"
            ans_n = n1 * n2
            ans_d = d1 * d2
            ans = f"{ans_n}/{ans_d}"
            
            wrong1 = f"{ans_n+1}/{ans_d}"
            distract_d = min(ans_d+1, 30)
            wrong2 = f"{ans_n}/{distract_d}"
            wrong3 = f"{max(ans_n-1, 1)}/{ans_d}"
            
            options = list(set([ans, wrong1, wrong2, wrong3]))
            while len(options) < 4:
                options.append(f"{random.randint(1, 15)}/{ans_d}")
                options = list(set(options))
            random.shuffle(options)
            
            questions.append({
                "id": f"q_medium_{len(questions)}",
                "content": content,
                "options": options[:4],
                "correct_answer": ans,
                "difficulty": "medium",
                "subject": "fractions",
                "hints": {
                    "step_by_step": f"Multiply the numerators ({n1}*{n2}={ans_n}) and denominators ({d1}*{d2}={ans_d}).",
                    "real_world": f"If you possess {n1}/{d1} of a pizza and give away exactly {n2}/{d2} of YOUR portion, they get {ans_n}/{ans_d} of a full pizza.",
                    "visual": f"Draw a rectangle with {d1} columns and {d2} rows. Shading {n1} cols and {n2} rows intersects {ans_n} boxes out of {ans_d}."
                }
            })

        elif level == "hard":
            # Division of fractions
            d1 = random.randint(2, 6)
            d2 = random.randint(2, 6)
            n1 = random.randint(1, d1-1)
            n2 = random.randint(1, d2-1)
            
            content = f"What is {n1}/{d1} / {n2}/{d2}?"
            ans_n = n1 * d2
            ans_d = d1 * n2
            ans = f"{ans_n}/{ans_d}"
            
            wrong1 = f"{n1*n2}/{d1*d2}"
            wrong2 = f"{ans_n+1}/{ans_d}"
            wrong3 = f"{max(ans_n-1, 1)}/{ans_d}"
            
            options = list(set([ans, wrong1, wrong2, wrong3]))
            while len(options) < 4:
                options.append(f"{random.randint(1, 15)}/{ans_d}")
                options = list(set(options))
            random.shuffle(options)
            
            questions.append({
                "id": f"q_hard_{len(questions)}",
                "content": content,
                "options": options[:4],
                "correct_answer": ans,
                "difficulty": "hard",
                "subject": "fractions",
                "hints": {
                    "step_by_step": f"Keep the first fraction, flip the second fraction ({d2}/{n2}), and multiply.",
                    "real_world": f"If you have {n1}/{d1} of a pizza and you want to slice it into smaller portions of size {n2}/{d2}, you will get {ans_n}/{ans_d} identical portions.",
                    "visual": f"Take a shape showing {n1}/{d1}. To divide by {n2}/{d2}, you're effectively multiplying by the reciprocal."
                }
            })
            
        elif level == "master":
            # Placeholder, update_frac_master.py will overwrite this anyway
            questions.append({
                "id": f"q_master_{len(questions)}",
                "content": "Evaluate: 5/6 * (2/3 + 1/4)",
                "options": ["55/72", "25/36", "5/12", "15/24"],
                "correct_answer": "55/72",
                "difficulty": "master",
                "subject": "fractions",
                "hints": {"step_by_step": "Order of operations"}
            })

def add_algebra_questions(level, count):
    for _ in range(count):
        if level == "easy":
            # Two-step equations
            x = random.randint(2, 12)
            a = random.randint(2, 8)
            b = random.randint(1, 15)
            c = a * x + b
            
            content = f"Find x: {a}x + {b} = {c}"
            ans = str(x)
            options = list(set([ans, str(x+1), str(abs(x-1)), str(x+2)]))
            while len(options) < 4:
                options.append(str(random.randint(1, 20)))
                options = list(set(options))
            random.shuffle(options)
            
            questions.append({
                "id": f"q_alg_easy_{len(questions)}",
                "content": content,
                "options": options[:4],
                "correct_answer": ans,
                "difficulty": "easy",
                "subject": "algebra",
                "hints": {
                    "step_by_step": f"First subtract {b} from both sides to get {a}x = {c-b}. Then divide by {a}.",
                    "real_world": f"You bought {a} identical items and spent a flat fee of ${b}, totaling ${c}. Find the cost per item.",
                    "visual": f"Scale: [ {a}x ] + [ {b} ] == [ {c} ]. Remove {b} first, then divide by {a}."
                }
            })
            
        elif level == "medium":
            # Variables on both sides
            x = random.randint(1, 10)
            a = random.randint(2, 6)
            c = random.randint(1, 4)
            while a == c: c = random.randint(1, 4)
            if a < c: a, c = c, a
            
            b = random.randint(1, 10)
            d = (a-c)*x + b
            
            content = f"Find x: {a}x + {b} = {c}x + {d}"
            ans = str(x)
            options = list(set([ans, str(x+1), str(x+2), str(abs(x-1))]))
            while len(options) < 4:
                options.append(str(random.randint(1, 15)))
                options = list(set(options))
            random.shuffle(options)
            
            questions.append({
                "id": f"q_alg_medium_{len(questions)}",
                "content": content,
                "options": options[:4],
                "correct_answer": ans,
                "difficulty": "medium",
                "subject": "algebra",
                "hints": {
                    "step_by_step": f"Move the x terms to one side: subtract {c}x. Move constants to the other: subtract {b}.",
                    "real_world": f"Company A charges ${b} plus ${a} per unit. Company B charges ${d} plus ${c} per unit. When are the costs equal?",
                    "visual": f"Scale: [ {a}x ] + [ {b} ] == [ {c}x ] + [ {d} ]. Take away {c} 'x's from both sides first."
                }
            })
            
        elif level == "hard":
            # Equations with distribution: a(x + b) = cx + d
            x = random.randint(2, 8)
            a = random.randint(2, 5)
            b = random.randint(1, 6)
            c = random.randint(1, 4)
            while a == c: c = random.randint(1, 4)
            
            # a(x+b) = ax + ab
            # we want ax + ab = cx + d
            # d = ax + ab - cx
            d = a*x + a*b - c*x
            
            content = f"Find x: {a}(x + {b}) = {c}x + {d}"
            ans = str(x)
            options = list(set([ans, str(x+1), str(x+2), str(abs(x-1))]))
            while len(options) < 4:
                options.append(str(random.randint(1, 15)))
                options = list(set(options))
            random.shuffle(options)
            
            questions.append({
                "id": f"q_alg_hard_{len(questions)}",
                "content": content,
                "options": options[:4],
                "correct_answer": ans,
                "difficulty": "hard",
                "subject": "algebra",
                "hints": {
                    "step_by_step": f"First distribute the {a} into the parentheses: {a}x + {a*b}. Then solve.",
                    "real_world": f"Buying {a} packs containing x items plus {b} bonus items equals buying {c} items plus {d} loose items.",
                    "visual": f"Expand the parentheses first."
                }
            })
            
        elif level == "master":
            # Quadratics: Find positive x: x^2 - {b}x + {c} = 0 -> (x-r1)(x-r2)=0
            r1 = random.randint(2, 8)
            r2 = random.randint(2, 8)
            while r1 == r2: r2 = random.randint(2, 8)
            b = r1 + r2
            c = r1 * r2
            
            # Since both are positive, we ask to find one of the solutions.
            # To ensure one correct answer, we can make one root negative.
            # (x - r1)(x + r2) = x^2 + (r2-r1)x - r1*r2 = 0
            # Let r1 be the positive root, r2 be the negative root.
            pos_root = random.randint(2, 10)
            neg_root = random.randint(1, 8)
            # x^2 + (neg_root - pos_root)x - (pos_root * neg_root) = 0
            b = neg_root - pos_root
            c = -(pos_root * neg_root)
            
            if b > 0:
                content = f"Find the positive solution for x: x^2 + {b}x - {abs(c)} = 0"
            elif b < 0:
                content = f"Find the positive solution for x: x^2 - {abs(b)}x - {abs(c)} = 0"
            else:
                content = f"Find the positive solution for x: x^2 - {abs(c)} = 0"
                
            ans = str(pos_root)
            options = list(set([ans, str(pos_root+1), str(neg_root), str(pos_root+2)]))
            while len(options) < 4:
                options.append(str(random.randint(1, 15)))
                options = list(set(options))
            random.shuffle(options)
            
            questions.append({
                "id": f"q_alg_master_{len(questions)}",
                "content": content,
                "options": options[:4],
                "correct_answer": ans,
                "difficulty": "master",
                "subject": "algebra",
                "hints": {
                    "step_by_step": f"Factor the quadratic equation into two binomials (x - {pos_root})(x + {neg_root}) = 0.",
                    "real_world": f"Finding the dimensions of a rectangle given its area.",
                    "visual": f"Use the AC method or quadratic formula."
                }
            })

add_questions("easy", 20)
add_questions("medium", 20)
add_questions("hard", 20)
add_questions("master", 20)

add_algebra_questions("easy", 20)
add_algebra_questions("medium", 20)
add_algebra_questions("hard", 20)
add_algebra_questions("master", 20)

with open('questions.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2)

print(f"Generated questions.json with {len(questions)} questions.")
