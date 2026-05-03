import os
import google.generativeai as genai
import PIL.Image
import PIL.ImageDraw
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=api_key)

# Create an image simulating the handwritten text
img = PIL.Image.new('RGB', (400, 200), color='white')
d = PIL.ImageDraw.Draw(img)
d.text((50, 50), "1/5 x 2/4 = (1x2)/(5x4) = 2/20", fill=(0,0,0))
img.save("simulated_scratchpad.png")

try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    question_text = "What is 1/5 x 2/4?"
    prompt = (
        f"You are a strict math tutor AI.\n"
        f"The student was asked to solve this fraction question: '{question_text}'\n"
        f"They uploaded this photo of their scratchpad/working out.\n\n"
        f"Task: Check if the photo contains valid mathematical working out (like finding common denominators, flipping fractions for division, or basic arithmetic attempts) that leads to the answer.\n"
        f"If it shows genuine mathematical effort, reply ONLY with the word 'YES'.\n"
        f"If it is a random photo, blank, or they are just wildly guessing without math, reply ONLY with the word 'NO'."
    )
    response = model.generate_content([prompt, img])
    print("RAW RESPONSE:")
    print(repr(response.text))
except Exception as e:
    import traceback
    traceback.print_exc()
