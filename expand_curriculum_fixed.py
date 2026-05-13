import json
import random
import math

with open("questions.json", "r") as f:
    data = json.load(f)

# Filter out old generated questions
data = [q for q in data if q.get("subject") not in ["exponents", "geometry"]]

exponents = []
geometry = []

diffs = [
    ("easy", 0, 20),
    ("medium", 20, 40),
    ("hard", 40, 60),
    ("master", 60, 80)
]

for diff, start_idx, end_idx in diffs:
    for i in range(start_idx, end_idx):
        if diff == "easy":
            # Multiplication/Division rules
            base = random.choice(['x', 'y', 'a', 'b'])
            p1 = random.randint(2, 6)
            p2 = random.randint(2, 6)
            op = random.choice(['*', '/'])
            if op == '*':
                q = f"Simplify: {base}^{p1} * {base}^{p2}"
                ans = f"{base}^{p1+p2}"
                opts = [ans, f"{base}^{p1*p2}", f"{base}^{abs(p1-p2)}", f"2{base}^{p1+p2}"]
                cor = ans
                hints = {"step_by_step": "When multiplying the same base, add the exponents.", "real_world": "Combining populations that grow exponentially.", "visual": "Adding powers."}
            else:
                if p1 <= p2: p1 = p2 + random.randint(1, 4)
                q = f"Simplify: {base}^{p1} / {base}^{p2}"
                ans = f"{base}^{p1-p2}"
                opts = [ans, f"{base}^{p1+p2}", f"{base}^{int(p1/p2) if p2!=0 else 0}", f"{base}^1"]
                cor = ans
                hints = {"step_by_step": "When dividing the same base, subtract the exponents.", "real_world": "Scaling massive quantities down.", "visual": "Canceling out common bases top and bottom."}
        elif diff == "medium":
            # Power of a power rule
            base = random.choice(['x', 'y', 'm', 'n'])
            p1 = random.randint(2, 5)
            p2 = random.randint(2, 4)
            q = f"Simplify: ({base}^{p1})^{p2}"
            ans = f"{base}^{p1*p2}"
            opts = [ans, f"{base}^{p1+p2}", f"{base}^{p1**p2}", f"{base*p2}^{p1}"]
            cor = ans
            hints = {"step_by_step": "When raising a power to a power, multiply the exponents.", "real_world": "Exponential growth squared.", "visual": "Multiply the powers together."}
        elif diff == "hard":
            # Negative exponents
            base = random.randint(2, 5)
            power = random.randint(2, 4)
            q = f"Evaluate: {base}^-{power}"
            ans = f"1/{base**power}"
            opts = [ans, f"-{base**power}", f"1/{base*power}", f"-{base*power}"]
            cor = ans
            hints = {"step_by_step": "A negative exponent means taking the reciprocal: a^-n = 1/a^n.", "real_world": "Microscopic scales.", "visual": "Flip it to the denominator."}
        else: # master
            # (ax^b)^c / x^d
            a = random.randint(2, 4)
            b = random.randint(2, 5)
            c = random.randint(2, 3)
            d = random.randint(1, b*c - 1)
            var = random.choice(['x', 'y'])
            q = f"Simplify: ({a}{var}^{b})^{c} / {var}^{d}"
            
            coeff = a**c
            final_p = (b*c) - d
            ans = f"{coeff}{var}^{final_p}"
            
            opts = [ans, f"{a*c}{var}^{final_p}", f"{coeff}{var}^{b*c+d}", f"{a**c}{var}^{b+c-d}"]
            cor = ans
            hints = {"step_by_step": "Distribute the outer power to both the coefficient and the variable, then subtract the denominator's exponent.", "real_world": "Complex scaling of multidimensional models.", "visual": "Apply power to number and letter separately."}
            
        opts = list(set(opts))
        while len(opts) < 4: opts.append(opts[0] + " ")
        random.shuffle(opts)
        
        exponents.append({
            "id": f"q_exp_{diff}_{i}",
            "content": q,
            "options": opts[:4],
            "correct_answer": cor,
            "difficulty": diff,
            "subject": "exponents",
            "hints": hints,
            "visual_data": {}
        })

for diff, start_idx, end_idx in diffs:
    for i in range(start_idx, end_idx):
        shape_type = random.choice(["circle", "pythagoras"]) if diff == "easy" else \
                     random.choice(["cylinder", "rectangular_prism"]) if diff == "medium" else \
                     random.choice(["cone", "sphere"]) if diff == "hard" else \
                     random.choice(["annulus", "compound"])
        
        q, ans, cor, opts, hints = "", "", "", [], {}
        
        if shape_type == "circle":
            r = random.randint(3, 9)
            cor = f"{r**2}pi"
            q = f"What is the exact area of a circle with radius {r}?"
            opts = [cor, f"{2*r}pi", f"{r**2}", f"{(r**2)+2}pi"]
            hints = {"step_by_step": "Use the formula Area = pi * r^2."}
        elif shape_type == "pythagoras":
            a = random.randint(3, 8)
            b = random.randint(3, 8)
            c2 = a**2 + b**2
            c_val = math.sqrt(c2)
            if c_val.is_integer():
                cor = str(int(c_val))
                opts = [cor, str(a+b), str(int(c_val)+2), str(int(c_val)-1)]
            else:
                cor = f"sqrt({c2})"
                opts = [cor, f"sqrt({a+b})", str(c2), f"sqrt({c2+5})"]
            q = f"In a right triangle with legs {a} and {b}, what is the length of the hypotenuse?"
            hints = {"step_by_step": "Use the Pythagorean theorem: a^2 + b^2 = c^2, then take the square root."}
        elif shape_type == "cylinder":
            r = random.randint(2, 6)
            h = random.randint(4, 10)
            cor = f"{r**2 * h}pi"
            q = f"What is the volume of a cylinder with radius {r} and height {h}?"
            opts = [cor, f"{2*r * h}pi", f"{r**2 * h}", f"{(r**2 * h)+2}pi"]
            hints = {"step_by_step": "Use the formula Volume = pi * r^2 * h."}
        elif shape_type == "rectangular_prism":
            l = random.randint(3, 8)
            w = random.randint(3, 8)
            h = random.randint(3, 8)
            cor = str(l * w * h)
            q = f"What is the volume of a rectangular prism with length {l}, width {w}, and height {h}?"
            opts = [cor, str(l*w+h), str(l+w+h), str(int(cor)+10)]
            hints = {"step_by_step": "Use the formula Volume = length * width * height."}
        elif shape_type == "cone":
            r = random.randint(3, 6)
            h = random.randint(3, 9)
            num = (r**2) * h
            if num % 3 == 0:
                cor = f"{num//3}pi"
                opts = [cor, f"{num}pi", f"{num//3}", f"{(num//3)+5}pi"]
            else:
                cor = f"({num}/3)pi"
                opts = [cor, f"({num}pi)", f"({num}/3)", f"({num+3}/3)pi"]
            q = f"What is the exact volume of a cone with radius {r} and height {h}?"
            hints = {"step_by_step": "Use the formula Volume = (1/3) * pi * r^2 * h."}
        elif shape_type == "sphere":
            r = random.randint(3, 6)
            num = 4 * (r**3)
            if num % 3 == 0:
                cor = f"{num//3}pi"
                opts = [cor, f"{num}pi", f"{num//3}", f"{(num//3)+5}pi"]
            else:
                cor = f"({num}/3)pi"
                opts = [cor, f"({num}pi)", f"({r**3})pi", f"({num+3}/3)pi"]
            q = f"What is the exact volume of a sphere with radius {r}?"
            hints = {"step_by_step": "Use the formula Volume = (4/3) * pi * r^3."}
        elif shape_type == "annulus":
            r1 = random.randint(2, 4)
            r2 = random.randint(5, 7)
            area_ans = (r2**2 - r1**2)
            cor = f"{area_ans}pi"
            q = f"What is the exact area of an annulus (ring) with an inner radius {r1} and an outer radius {r2}?"
            opts = [cor, f"{(r2-r1)**2}pi", f"{r2**2 + r1**2}pi", f"{area_ans + 2}pi"]
            hints = {"step_by_step": "Area = pi*R^2 - pi*r^2"}
        elif shape_type == "compound":
            s = random.randint(3, 9)
            cor = str(6 * (s**2))
            q = f"What is the total surface area of a cube with side length {s}?"
            opts = [cor, str(s**3), str(4*(s**2)), str(s**2)]
            hints = {"step_by_step": "Surface Area of a cube = 6 * side^2."}

        opts = list(set(opts))
        while len(opts) < 4: opts.append(opts[0] + " ")
        random.shuffle(opts)
        
        geometry.append({
            "id": f"q_geo_{diff}_{i}",
            "content": q,
            "options": opts[:4],
            "correct_answer": cor,
            "difficulty": diff,
            "subject": "geometry",
            "hints": hints,
            "visual_data": {}
        })

data.extend(exponents)
data.extend(geometry)

with open("questions.json", "w", encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print("done")
