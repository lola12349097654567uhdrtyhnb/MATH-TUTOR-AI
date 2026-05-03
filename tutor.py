import json
import os
import random
import pymongo
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), 'frontend', '.env.local'), override=True)

try:
    mongo_client = pymongo.MongoClient(os.getenv('MONGODB_URI'))
    mongo_db = mongo_client.get_default_database()
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")
    mongo_db = None

class BKTPomdpBrain:
    def __init__(self, topic="fractions"):
        self.topic = topic
        self.belief = 0.3  # Starting mastery (30%)
        # BKT Constants for Middle School Math
        self.p_guess = 0.2
        self.p_slip = 0.1
        self.p_transit = 0.1
        self.mastery_bias = 0.0
        self.learning_profile = {
            "preferred_method": "visual",
            "pacing": "balanced",
            "confidence": "medium",
            "support_level": "moderate",
            "hint_style": "step_by_step",
        }
        
        self.question_bank = {}
        
        # 1. ALWAYS load JSON first as the base curriculum
        questions_path = os.path.join(os.path.dirname(__file__), 'questions.json')
        if os.path.exists(questions_path):
            with open(questions_path, 'r', encoding='utf-8') as f:
                qs = json.load(f)
                for q in qs:
                    if q.get('subject') == self.topic:
                        self.question_bank[q['id']] = q

        # 2. Append/Override with MongoDB Instructor questions
        if mongo_db is not None:
            questions = list(mongo_db.questions.find({"subject": self.topic}))
            for q in questions:
                if '_id' in q:
                    del q['_id']
                self.question_bank[q['id']] = q
        
        self.diagnostic_questions = []
        if self.question_bank:
            if self.topic == "fractions":
                self.diagnostic_questions = [
                    self.question_bank.get("q_easy_0"),
                    self.question_bank.get("q_medium_20"),
                    self.question_bank.get("q_hard_40"),
                    self.question_bank.get("q_master_60")
                ]
            elif self.topic == "algebra":
                self.diagnostic_questions = [
                    self.question_bank.get("q_alg_easy_80"),
                    self.question_bank.get("q_alg_medium_100"),
                    self.question_bank.get("q_alg_hard_120"),
                    self.question_bank.get("q_alg_master_140")
                ]
            elif self.topic == "exponents":
                self.diagnostic_questions = [
                    self.question_bank.get("q_exp_easy_0"),
                    self.question_bank.get("q_exp_medium_20"),
                    self.question_bank.get("q_exp_hard_40"),
                    self.question_bank.get("q_exp_master_60")
                ]
            elif self.topic == "geometry":
                self.diagnostic_questions = [
                    self.question_bank.get("q_geo_easy_0"),
                    self.question_bank.get("q_geo_medium_20"),
                    self.question_bank.get("q_geo_hard_40"),
                    self.question_bank.get("q_geo_master_60")
                ]
            self.diagnostic_questions = [q for q in self.diagnostic_questions if q]

    def configure_profile(self, answers):
        self.learning_profile["preferred_method"] = answers.get("preferred_method", "visual")
        self.learning_profile["pacing"] = answers.get("pacing", "balanced")
        
        # Store both explicitly in profile
        self.learning_profile["confidence"] = answers.get("confidence", "medium")
        self.learning_profile["confidence_algebra"] = answers.get("confidence_algebra", "medium")
            
        self.learning_profile["support_level"] = answers.get("support_level", "moderate")
        self.learning_profile["hint_style"] = answers.get("hint_style", "step_by_step")
        self._apply_profile()

    def _apply_profile(self):
        # Tune BKT behavior from questionnaire responses.
        self.p_guess = 0.2
        self.p_slip = 0.1
        self.p_transit = 0.1
        self.mastery_bias = 0.0
        
        conf = self.learning_profile.get("confidence_algebra") if self.topic == "algebra" else self.learning_profile.get("confidence")

        if conf == "low":
            self.mastery_bias = -0.05
            self.p_slip += 0.03
        elif conf == "high":
            self.mastery_bias = 0.02
            self.p_slip -= 0.02

        if self.learning_profile["pacing"] == "slow":
            self.p_transit -= 0.02
        elif self.learning_profile["pacing"] == "fast":
            self.p_transit += 0.02

        if self.learning_profile["support_level"] == "high":
            self.p_slip -= 0.02
        elif self.learning_profile["support_level"] == "low":
            self.p_slip += 0.02

        # Keep probabilities in safe ranges.
        self.p_guess = min(max(self.p_guess, 0.05), 0.4)
        self.p_slip = min(max(self.p_slip, 0.02), 0.35)
        self.p_transit = min(max(self.p_transit, 0.02), 0.35)
        self.belief = min(max(0.3 + self.mastery_bias, 0.05), 0.95)

    def _response_time_factor(self, response_time_seconds):
        if response_time_seconds is None:
            return 0.0
        # Instant guess penalty for multiple choice
        if response_time_seconds < 3:
            return -0.05
        # Ideal thinking time
        if response_time_seconds <= 15:
            return 0.02
        if response_time_seconds <= 30:
            return 0.0
        return -0.03

    def update_bkt(self, is_correct, response_time_seconds=None, student_answer="", hint_used=False, attempt_count=1):
        # The BKT Math: Updates the probability of mastery
        if is_correct:
            num = self.belief * (1 - self.p_slip)
            den = num + (1 - self.belief) * self.p_guess
        else:
            num = self.belief * self.p_slip
            den = num + (1 - self.belief) * (1 - self.p_guess)
        
        # Calculate new belief and add the 'Learning' transition
        posterior = num / den
        
        effective_transit = self.p_transit
        if hint_used and is_correct:
            effective_transit = self.p_transit * 0.5

        raw_new_belief = posterior + (1 - posterior) * effective_transit
        raw_new_belief += self.mastery_bias * 0.2
        raw_new_belief += self._response_time_factor(response_time_seconds)
        
        # Penalize extra attempts 
        if attempt_count > 1:
            raw_new_belief -= 0.04 * (attempt_count - 1)
            
        # Pacing Enforcer: Limit the maximum change per question to ~0.08.
        # This guarantees the user stays at a level for 3-4 questions before crossing thresholds.
        max_jump = 0.085
        diff = raw_new_belief - self.belief
        
        if diff > max_jump:
            new_belief = self.belief + max_jump
        elif diff < -max_jump:
            new_belief = self.belief - max_jump
        else:
            new_belief = raw_new_belief

        self.belief = min(max(new_belief, 0.01), 0.99)
        return self.belief

    def check_answer(self, question_id, student_answer):
        question = self.question_bank.get(question_id, {})
        valid_answer = question.get("correct_answer", "")
        if not valid_answer and "answers" in question:
            return (student_answer or "").strip().lower() in [a.strip().lower() for a in question["answers"]]
        return (student_answer or "").strip().lower() == valid_answer.strip().lower()

    def check_diagnostic_answer(self, question_id, student_answer):
        matched = next((item for item in self.diagnostic_questions if item["id"] == question_id), None)
        if not matched:
            return False
        valid_answer = matched.get("correct_answer", "")
        if not valid_answer:
            return (student_answer or "").strip().lower() in [a.strip().lower() for a in matched.get("answers", [])]
        return (student_answer or "").strip().lower() == valid_answer.strip().lower()

    def set_starting_mastery_from_diagnostic(self, correct_count, total_count, average_time_seconds):
        if total_count <= 0:
            return self.belief

        count_map = {
            4: 0.95,
            3: 0.80,
            2: 0.60,
            1: 0.35,
            0: 0.10
        }
        baseline = count_map.get(correct_count, 0.30)

        if average_time_seconds is None:
            time_factor = 0.0
        elif average_time_seconds <= 8:
            time_factor = 0.05
        elif average_time_seconds <= 16:
            time_factor = 0.0
        else:
            time_factor = -0.05

        self.belief = min(max(baseline + self.mastery_bias + time_factor, 0.05), 0.95)
        return self.belief

    def get_pomdp_action(self, seen_question_ids=None):
        if seen_question_ids is None:
            seen_question_ids = []
            
        if self.belief < 0.4:
            target_diff = "easy"
        elif self.belief < 0.7:
            target_diff = "medium"
        elif self.belief < 0.9:
            target_diff = "hard"
        else:
            target_diff = "master"
            
        # Get all questions of this difficulty
        pool = [q for q in self.question_bank.values() if q.get("difficulty") == target_diff]
        unseen_pool = [q for q in pool if q["id"] not in seen_question_ids]
        
        # Fallback to older questions if exhausted
        if not unseen_pool and pool:
            unseen_pool = pool
            
        # If still empty for some reason, grab anything unseen
        if not unseen_pool:
            all_unseen = [q for q in self.question_bank.values() if q["id"] not in seen_question_ids]
            if all_unseen:
                unseen_pool = all_unseen
            else:
                unseen_pool = list(self.question_bank.values())
                
        chosen = random.choice(unseen_pool) if unseen_pool else {}
        
        return {
            "type": "question",
            "id": chosen.get("id"),
            "content": chosen.get("content"),
            "options": chosen.get("options", []),
            "difficulty": chosen.get("difficulty"),
            "subject": chosen.get("subject", "fractions")
        }

    def get_hint(self, question_id):
        question = self.question_bank.get(question_id, {})
        style = self.learning_profile.get("hint_style", "step_by_step")
        hints_obj = question.get("hints", {})
        
        hint_text = hints_obj.get(style, "Try breaking the fraction problem into smaller steps.")
        
        response = {
            "question_id": question_id,
            "style": style,
            "text": hint_text,
            "mode": "visual" if style == "visual" else "text",
        }
        if style == "visual" and "visual_data" in question:
            response["visual"] = question["visual_data"]
            
        return response