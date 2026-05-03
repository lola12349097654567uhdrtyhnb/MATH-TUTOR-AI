from ai_grader import grade_scratchpad
from PIL import Image

# create dummy image
img = Image.new('RGB', (100, 100), color = 'white')
img.save('dummy.png')

print("Testing grader...")
res = grade_scratchpad('dummy.png', 'what is 1/2 + 1/4? = 3/4')
print("Result:", res)
