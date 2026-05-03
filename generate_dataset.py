import json
import random

questions = []

def add_questions(level, count):
    # Depending on level, we generate different types of questions
    for _ in range(count):
        if level == "easy":
            d = random.randint(3, 10)
            n1 = random.randint(1, d - 1)
            n2 = random.randint(1, d - n1) if d - n1 > 1 else 1
            if n2 >= d - n1: n2 = d - n1
            ans_n = n1 + n2
            content = f"What is {n1}/{d} + {n2}/{d}?"
            ans = f"{ans_n}/{d}"
            
            wrong1 = f"{ans_n+1}/{d}"
            wrong2 = f"{ans_n-1}/{d}"
            if wrong2 == "0/"+str(d) or wrong2 == ans: wrong2 = f"1/{d}"
            wrong3 = f"{n1+n2}/{d*2}"
            
            options = list(set([ans, wrong1, wrong2, wrong3]))
            while len(options) < 4:
                options.append(f"{random.randint(2,10)}/{d}")
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
                    "step_by_step": f"Since the denominators are the same ({d}), just add the numerators: {n1} + {n2}.",
                    "real_world": f"If you have a pizza cut into {d} slices, and you eat {n1} slices and then another {n2} slices, you've eaten {ans_n} slices.",
                    "visual": f"Imagine two visual bars both split into {d} pieces. Highlighting {n1} pieces on the first and {n2} on the second combines to {ans_n} total pieces out of {d}."
                },
                "visual_data": {"left": {"numerator": n1, "denominator": d}, "right": {"numerator": n2, "denominator": d}}
            })
            
        elif level == "medium":
            d1 = random.choice([2, 3, 4, 5])
            d2 = random.choice([2, 3, 4, 5])
            while d1 == d2: d2 = random.choice([2, 3, 4, 5])
            n1 = random.randint(1, d1-1)
            n2 = random.randint(1, d2-1)
            
            common_d = d1 * d2
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
                "id": f"q_medium_{len(questions)}",
                "content": content,
                "options": options[:4],
                "correct_answer": ans,
                "difficulty": "medium",
                "subject": "fractions",
                "hints": {
                    "step_by_step": f"Find a common denominator by multiplying {d1} and {d2} to get {common_d}. Then adjust numerators: ({n1}*{d2})+({n2}*{d1}).",
                    "real_world": f"To combine slices from a pizza cut into {d1} pieces with one cut into {d2} pieces, we recut them both into {common_d} total slices.",
                    "visual": f"Imagine splitting the {d1}-part circle explicitly into {common_d} parts, doing the same for the {d2}-part circle, then adding."
                },
                "visual_data": {"left": {"numerator": n1, "denominator": d1}, "right": {"numerator": n2, "denominator": d2}}
            })

        elif level == "hard":
            d1 = random.choice([3, 4, 5, 6, 7])
            d2 = random.choice([3, 4, 5, 6, 7])
            while d1 == d2: d2 = random.choice([3, 4, 5, 6, 7])
            common_d = d1 * d2
            
            n1 = random.randint(2, d1-1)
            n2 = random.randint(1, d2-1)
            
            val1 = n1 * d2
            val2 = n2 * d1
            if val1 < val2:
                n1, n2 = n2, n1
                d1, d2 = d2, d1
                val1, val2 = val2, val1
            
            ans_n = val1 - val2
            content = f"What is {n1}/{d1} - {n2}/{d2}?"
            if ans_n == 0:
                ans = "0"
            else:
                ans = f"{ans_n}/{common_d}"
            
            wrong1 = f"{abs(n1-n2)}/{max(d1, d2)}"
            wrong2 = f"{ans_n+1}/{common_d}"
            wrong3 = f"{val1+val2}/{common_d}"
            
            options = list(set([ans, wrong1, wrong2, wrong3]))
            while len(options) < 4:
                options.append(f"{random.randint(1, common_d-1)}/{common_d}")
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
                    "step_by_step": f"Find a common denominator ({common_d}) and convert both fractions. Then subtract the second numerator from the first.",
                    "real_world": f"If you have {n1}/{d1} of a pizza left and someone eats {n2}/{d2} of a whole pizza out of it, convert to {common_d} slices to see what's left.",
                    "visual": f"Think of a bar cut into {common_d} slices. The first fraction takes up {val1} slices. You remove {val2} slices."
                },
                "visual_data": {"left": {"numerator": n1, "denominator": d1}, "right": {"numerator": n2, "denominator": d2}}
            })
            
        elif level == "master":
            op = random.choice(["*", "/"])
            d1 = random.randint(2, 6)
            d2 = random.randint(2, 6)
            n1 = random.randint(1, d1-1)
            n2 = random.randint(1, d2-1)
            
            if op == "*":
                content = f"What is {n1}/{d1} × {n2}/{d2}?"
                ans_n = n1 * n2
                ans_d = d1 * d2
                h_step = f"Multiply the numerators ({n1}×{n2}={ans_n}) and denominators ({d1}×{d2}={ans_d})."
                h_real = f"If you possess {n1}/{d1} of a pizza and give away exactly {n2}/{d2} of YOUR portion to a friend, they get {ans_n}/{ans_d} of a full pizza."
                h_vis = f"Draw a rectangle with {d1} columns and {d2} rows. Shading {n1} cols and {n2} rows intersects {ans_n} boxes out of {ans_d}."
            else:
                content = f"What is {n1}/{d1} ÷ {n2}/{d2}?"
                ans_n = n1 * d2
                ans_d = d1 * n2
                h_step = f"Keep the first fraction, flip the second fraction ({d2}/{n2}), and multiply."
                h_real = f"If you have {n1}/{d1} of a pizza and you want to slice it into smaller portions of size {n2}/{d2}, you will get {ans_n}/{ans_d} identical portions."
                h_vis = f"Take a shape showing {n1}/{d1}. To divide by {n2}/{d2}, you're effectively multiplying by the reciprocal."
            
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
                "id": f"q_master_{len(questions)}",
                "content": content,
                "options": options[:4],
                "correct_answer": ans,
                "difficulty": "master",
                "subject": "fractions",
                "hints": {
                    "step_by_step": h_step,
                    "real_world": h_real,
                    "visual": h_vis
                },
                "visual_data": {"left": {"numerator": n1, "denominator": d1}, "right": {"numerator": n2, "denominator": d2}}
            })

def add_algebra_questions(level, count):
    for _ in range(count):
        if level == "easy":
            x = random.randint(1, 20)
            a = random.randint(1, 20)
            b = x + a
            
            content = f"Find x: x + {a} = {b}"
            ans = str(x)
            options = list(set([ans, str(x+1), str(abs(x-1)), str(x+a)]))
            while len(options) < 4:
                options.append(str(random.randint(1, 30)))
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
                    "step_by_step": f"Subtract {a} from both sides to isolate x.",
                    "real_world": f"If you have an unknown amount of apples and you get {a} more to have {b} total, how many did you start with?",
                    "visual": f"Scale: [ x ] + [ {a} weights ] == [ {b} weights ]. Remove {a} weights from both sides."
                }
            })
            
        elif level == "medium":
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
                "id": f"q_alg_medium_{len(questions)}",
                "content": content,
                "options": options[:4],
                "correct_answer": ans,
                "difficulty": "medium",
                "subject": "algebra",
                "hints": {
                    "step_by_step": f"First subtract {b} from both sides to get {a}x = {c-b}. Then divide by {a}.",
                    "real_world": f"You bought {a} identical items and spent a flat fee of ${b}, totaling ${c}. Find the cost per item.",
                    "visual": f"Scale: [ {a}x ] + [ {b} ] == [ {c} ]. Remove {b} first, then divide by {a}."
                }
            })
            
        elif level == "hard":
            x = random.randint(1, 10)
            a = random.randint(2, 6)
            c = random.randint(1, 4)
            while a == c: c = random.randint(1, 4)
            
            if a < c:
                a, c = c, a
                
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
                "id": f"q_alg_hard_{len(questions)}",
                "content": content,
                "options": options[:4],
                "correct_answer": ans,
                "difficulty": "hard",
                "subject": "algebra",
                "hints": {
                    "step_by_step": f"Move the x terms to one side: subtract {c}x. Move constants to the other: subtract {b}.",
                    "real_world": f"Company A charges ${b} plus ${a} per unit. Company B charges ${d} plus ${c} per unit. When are the costs equal?",
                    "visual": f"Scale: [ {a}x ] + [ {b} ] == [ {c}x ] + [ {d} ]. Take away {c} 'x's from both sides first."
                }
            })
            
        elif level == "master":
            x = random.randint(2, 8)
            c = random.choice([2, 3, 4, 5])
            d = random.randint(2, 5)
            e = random.randint(1, 4)
            
            # Equation: (ax + b) / c = dx + e
            # c * dx + c * e = ax + b
            a = random.randint(c*d + 1, c*d + 5)
            # Find b such that x is an integer
            b = c * d * x + c * e - a * x
            
            if b >= 0:
                content = f"Find x: ({a}x + {b})/{c} = {d}x + {e}"
            else:
                content = f"Find x: ({a}x - {abs(b)})/{c} = {d}x + {e}"
                
            ans = str(x)
            options = list(set([ans, str(x+1), str(abs(x-1)), str(x+2)]))
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
                    "step_by_step": f"Multiply both sides by {c} to clear the fraction. Then group 'x' terms on one side.",
                    "real_world": f"Sharing the quantity ({a}x {f'+ {b}' if b>=0 else f'- {abs(b)}'}) equally among {c} groups gives {d}x + {e} per group.",
                    "visual": f"Scale: 1/{c} of [ {a}x + {b} ] == [ {d}x + {e} ]. Multiply the entire right side by {c}."
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
