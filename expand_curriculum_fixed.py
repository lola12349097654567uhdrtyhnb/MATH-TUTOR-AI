import json
import random

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
            base = random.randint(2, 5)
            power = random.randint(2, 4)
            ans = base**power
            q = f"What is {base}^{power}?"
            opts = [str(ans), str(ans+base), str(base*power), str(ans-base)]
            cor = str(ans)
            hints = {"step_by_step": f"Multiply {base} by itself {power} times.", "real_world": "Think of exponential cell division.", "visual": "Tree branches multiplying."}
        elif diff == "medium":
            base = random.randint(2, 4)
            p1 = random.randint(2, 4)
            p2 = random.randint(2, 4)
            q = f"Simplify: {base}^{p1} * {base}^{p2}"
            ans = f"{base}^{p1+p2}"
            opts = [ans, f"{base}^{p1*p2}", f"{base*2}^{p1+p2}", f"{base}^{abs(p1-p2)}"]
            cor = ans
            hints = {"step_by_step": "When multiplying the same base, add the exponents.", "real_world": "Combining populations that grow exponentially.", "visual": "Adding powers."}
        elif diff == "hard":
            num = random.randint(1, 9)
            power = random.randint(3, 7)
            val = num * (10**power)
            ans = f"{num} x 10^{power}"
            q = f"Write {val} in scientific notation."
            opts = [ans, f"{num} x 10^{power-1}", f"{num*10} x 10^{power-1}", f"{num} x 10^{power+1}"]
            cor = ans
            hints = {"step_by_step": "Count the zeros to determine the power of 10.", "real_world": "Distances in space.", "visual": "Shift the decimal point."}
        else: # master
            base = random.randint(2, 3)
            p1 = random.randint(2, 4)
            p2 = random.randint(2, 4)
            p3 = random.randint(1, 2)
            q = f"Simplify: ({base}^{p1} * {base}^{p2}) / {base}^{p3}"
            ans = f"{base}^{p1+p2-p3}"
            opts = [ans, f"{base}^{p1*p2-p3}", f"{base}^{p1+p2+p3}", f"{base}^{max(1, p1+p2-p3+1)}"]
            cor = ans
            hints = {"step_by_step": "Add exponents for multiplication, then subtract the exponent of the denominator.", "real_world": "Scaling massive quantities down.", "visual": "Canceling out common bases top and bottom."}
            
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
        shape_type = random.choice(["rectangle", "square", "triangle"]) if diff == "easy" else \
                     random.choice(["circle", "pythagoras"]) if diff == "medium" else \
                     random.choice(["cylinder", "sphere", "rectangular_prism"]) if diff == "hard" else \
                     random.choice(["annulus", "compound"])
        
        q, ans, cor, opts, hints = "", "", "", [], {}
        
        if shape_type == "rectangle":
            l = random.randint(3, 12)
            w = random.randint(3, 12)
            cor = str(l * w)
            q = f"What is the area of a rectangle with length {l} and width {w}?"
            opts = [cor, str(l*w+2), str(l+w), str((l+w)*2)]
            hints = {"step_by_step": "Use the formula Area = length * width."}
        elif shape_type == "square":
            s = random.randint(4, 15)
            cor = str(s * s)
            q = f"What is the area of a square with side length {s}?"
            opts = [cor, str(s*2), str(s*4), str(s*s+1)]
            hints = {"step_by_step": "Use the formula Area = side * side (or s^2)."}
        elif shape_type == "triangle":
            b = random.randint(3, 10)
            h = random.randint(3, 10)
            if (b * h) % 2 != 0: h += 1
            cor = str((b * h) // 2)
            q = f"What is the area of a triangle with base {b} and height {h}?"
            opts = [cor, str(b*h), str(b+h), str(int(cor)+2)]
            hints = {"step_by_step": "Use the formula Area = (base * height) / 2."}
        elif shape_type == "circle":
            r = random.randint(3, 9)
            cor = f"{r**2}pi"
            q = f"What is the exact area of a circle with radius {r}?"
            opts = [cor, f"{2*r}pi", f"{r**2}", f"{(r**2)+2}pi"]
            hints = {"step_by_step": "Use the formula Area = pi * r^2."}
        elif shape_type == "pythagoras":
            a = random.randint(3, 8)
            b = random.randint(3, 8)
            c2 = a**2 + b**2
            cor = str(c2)
            q = f"In a right triangle with legs {a} and {b}, what is the square of the hypotenuse (c^2)?"
            opts = [cor, str(a+b), str(c2+10), str(c2-10)]
            hints = {"step_by_step": "Use the Pythagorean theorem: a^2 + b^2 = c^2."}
        elif shape_type == "cylinder":
            r = random.randint(2, 6)
            h = random.randint(4, 10)
            cor = f"{r**2 * h}pi"
            q = f"What is the volume of a cylinder with radius {r} and height {h}?"
            opts = [cor, f"{2*r * h}pi", f"{r**2 * h}", f"{(r**2 * h)+2}pi"]
            hints = {"step_by_step": "Use the formula Volume = pi * r^2 * h."}
        elif shape_type == "sphere":
            r = random.randint(3, 6)
            num = 4 * (r**3)
            cor = f"({num}/3)pi"
            q = f"What is the exact volume of a sphere with radius {r}?"
            opts = [cor, f"({num}pi)", f"({r**3})pi", f"({num+3}/3)pi"]
            hints = {"step_by_step": "Use the formula Volume = (4/3) * pi * r^3."}
        elif shape_type == "rectangular_prism":
            l = random.randint(2, 6)
            w = random.randint(2, 6)
            h = random.randint(2, 6)
            cor = str(l * w * h)
            q = f"What is the volume of a rectangular prism with length {l}, width {w}, and height {h}?"
            opts = [cor, str(l*w+h), str(l+w+h), str(int(cor)+2)]
            hints = {"step_by_step": "Use the formula Volume = length * width * height."}
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

with open("questions.json", "w") as f:
    json.dump(data, f, indent=2)

print("done")
