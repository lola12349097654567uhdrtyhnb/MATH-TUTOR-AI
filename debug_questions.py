from tutor import BKTPomdpBrain

try:
    brain = BKTPomdpBrain("fractions")
    print(f"Total Fractions Questions: {len(brain.question_bank)}")
    print(f"Sample Question: {list(brain.question_bank.values())[0] if brain.question_bank else 'None'}")
    
    brain_alg = BKTPomdpBrain("algebra")
    print(f"Total Algebra Questions: {len(brain_alg.question_bank)}")
except Exception as e:
    print(f"Error initializing brain: {e}")
