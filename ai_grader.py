import os
import io
import base64
import google.generativeai as genai
import PIL.Image

def setup_gemini():
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        genai.configure(api_key=api_key)

def grade_scratchpad(base64_string, question_text, topic='fractions'):
    setup_gemini()
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Decode image from RAM instead of disk
        img_data = base64.b64decode(base64_string)
        img = PIL.Image.open(io.BytesIO(img_data))
        topic_rules = ""
        if topic == 'algebra':
            topic_rules = (
                "ALGEBRA SPECIFIC RULES:\n"
                "- Ensure the student correctly isolates the variable. Transposing (moving a value across the equal sign and changing its sign) is perfectly acceptable.\n"
                "- HANDWRITING WARNING: The number '1' often has a large top hook making it look exactly like a '7'. If the math mathematically works for '1' but fails for '7', YOU MUST assume the student wrote a '1'. Always give the benefit of the doubt to the math working out!\n"
            )
        elif topic == 'exponents':
            topic_rules = (
                "EXPONENTS SPECIFIC RULES:\n"
                "- When multiplying same bases, verify the student adds the exponents.\n"
                "- With scientific notation, check that the decimal shift length matches the power of 10 exactly.\n"
            )
        elif topic == 'geometry':
            topic_rules = (
                "GEOMETRY SPECIFIC RULES:\n"
                "- The student MUST explicitly write down the fundamental area/volume formula on their paper before substituting numbers.\n"
                "- REJECT the working out if the raw formula is missing, even if the final calculation is correct.\n"
                "- Variables: Standard letters (e.g., 'r' for radius, 'h' for height, 'b' for base, or standard Pythagorean letters 'a', 'b', 'c') do NOT need clarification.\n"
                "- Custom Variables: Any other letters (e.g., 'x' for height) CAN be used, BUT the student MUST write a clarification statement (e.g., 'x = height') on the paper. If they use a random unclarified letter, REJECT it.\n"
                "- For Pythagorean theorem: Ensure they correctly square both sides before adding/subtracting.\n"
                "- ERROR PARSING DO THIS EXACTLY:\n"
                "  1) If the student used the WRONG formula for the shape, classify as 'geometry_wrong_formula', set verdict to 'REJECTED', and in the feedback_reason you MUST state the correct formula directly to them.\n"
                "  2) If the formula is CORRECT but their multiplication/calculation is wrong, classify as 'geometry_calculation_error', set verdict to 'REJECTED', and state exactly this in your feedback_reason: 'The rule is right but the working out is wrong.'\n"
            )
        else:
            topic_rules = (
                "FRACTIONS SPECIFIC RULES:\n"
                "- Verify finding common denominators if adding/subtracting.\n"
                "- Check if simplifying numerators/denominators is mathematically correct.\n"
            )

        prompt = (
            f"You are an elite math reasoning evaluator. Look carefully at the student's scratchpad photo.\n"
            f"The student was asked to solve: '{question_text}'\n\n"
            f"{topic_rules}\n"
            f"Task: Verify whether the student's handwritten working out is mathematically sound.\n\n"
            f"Instructions:\n"
            f"You MUST return a pure JSON object with exactly these four keys:\n"
            f"1. \"thought_process\": Explicitly transcribe the math steps they wrote down and validate each step logically.\n"
            f"2. \"verdict\": Exactly 'ACCEPTED' or 'REJECTED'. Do not accept blind guessing or missing operations. If they wrote the correct answer but the steps are magical/absent, REJECT it.\n"
            f"3. \"feedback_reason\": A highly specific, encouraging 1-2 sentence explanation directed at the student. For errors, pinpoint the exact step they broke logic. If Accepted, congratulate them.\n"
            f"4. \"sub_topic\": Classify precisely what concept the question (or error) belongs to. Choose from the following list ONLY:\n"
            f"    - fraction_addition\n"
            f"    - fraction_subtraction\n"
            f"    - fraction_multiplication\n"
            f"    - fraction_division\n"
            f"    - algebra_transposing\n"
            f"    - algebra_substitution\n"
            f"    - exponents_laws\n"
            f"    - exponents_scientific\n"
            f"    - geometry_pythagoras\n"
            f"    - geometry_formulas\n"
            f"    - geometry_wrong_formula\n"
            f"    - geometry_calculation_error\n"
            f"    - default\n"
        )
        
        response = model.generate_content(
            [prompt, img],
            generation_config={"response_mime_type": "application/json"}
        )
        
        import json
        result = json.loads(response.text)
        
        print("\n\n=== GOOGLE GEMINI MATH ANALYSIS ===")
        print(response.text)
        print("===================================\n\n")
        
        with open('gemini_logs.txt', 'a', encoding='utf-8') as f:
            f.write("\n\n=== GOOGLE GEMINI MATH ANALYSIS ===\n")
            f.write(response.text)
            f.write("\n===================================\n\n")
            
        return {
            "is_valid": result.get("verdict") == "ACCEPTED",
            "feedback": result.get("feedback_reason", ""),
            "sub_topic": result.get("sub_topic", "default")
        }
    except Exception as e:
        print(f"Error calling Gemini AI: {e}")
        return {
            "is_valid": False,
            "feedback": "There was an error analyzing your image. Please ensure it is clear and try again.",
            "sub_topic": "default"
        }
