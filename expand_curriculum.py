import json
import random

with open("questions.json", "r") as f:
    data = json.load(f)

exponents = []
for i in range(96):
    diff = "easy" if i < 30 else ("medium" if i < 70 else "hard")
    
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
    else:
        num = random.randint(1, 9)
        power = random.randint(3, 6)
        ans = f"{num} x 10^{power}"
        val = num * (10**power)
        q = f"Write {val} in scientific notation."
        opts = [ans, f"{num} x 10^{power-1}", f"{num*10} x 10^{power-1}", f"{num} x 10^{power+1}"]
        cor = ans
        hints = {"step_by_step": "Count the zeros to determine the power of 10.", "real_world": "Distances in space are written this way.", "visual": "Shift the decimal point."}
    
    opts = list(set(opts))
    while len(opts) < 4:
        opts.append(opts[0] + " ") 
    random.shuffle(opts)
    
    exponents.append({
        "id": f"q_exp_{i}",
        "content": q,
        "options": opts[:4],
        "correct_answer": cor,
        "difficulty": diff,
        "subject": "exponents",
        "hints": hints,
        "visual_data": {}
    })

geometry = []
for i in range(96):
    diff = "easy" if i < 30 else ("medium" if i < 70 else "hard")
    
    if diff == "easy":
        base = random.randint(3, 10)
        height = random.randint(3, 10)
        # Avoid odd / 2 generating decimals by making height even
        if (base * height) % 2 != 0:
            height += 1
            
        ans = (base * height) // 2
        q = f"What is the area of a triangle with base {base} and height {height}?"
        opts = [str(ans), str(base*height), str(base+height), str(ans+2)]
        cor = str(ans)
        hints = {"step_by_step": "Use the formula Area = (base * height) / 2.", "real_world": "Half of a rectangular piece of paper.", "visual": "A rectangle sliced diagonally."}
    elif diff == "medium":
        a = random.randint(3, 8)
        b = random.randint(3, 8)
        c2 = a**2 + b**2
        q = f"In a right triangle with legs {a} and {b}, what is the square of the hypotenuse?"
        opts = [str(c2), str(a+b), str(c2+10), str(c2-10)]
        cor = str(c2)
        hints = {"step_by_step": "Use the Pythagorean theorem: a^2 + b^2 = c^2.", "real_world": "Finding the direct distance across a rectangular field.", "visual": "Squares on the sides of a right triangle."}
    else:
        r = random.randint(2, 6)
        h = random.randint(4, 10)
        q = f"What is the volume of a cylinder with radius {r} and height {h}?"
        ans = f"{r**2 * h}pi"
        opts = [ans, f"{2*r * h}pi", f"{r**2 * h}", f"{(r**2 * h)+2}pi"]
        cor = ans
        hints = {"step_by_step": "Use the formula Volume = pi * r^2 * h.", "real_world": "Volume of a can of soup.", "visual": "Stacking circles."}
        
    opts = list(set(opts))
    while len(opts) < 4:
        opts.append(opts[0] + " ")
    random.shuffle(opts)
    
    geometry.append({
        "id": f"q_geo_{i}",
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
