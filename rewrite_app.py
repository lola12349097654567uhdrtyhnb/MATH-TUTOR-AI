import re
with open('app.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace all instances of `_fractions` with dynamically injected `_{topic}`.
# But first, we need to extract `topic` from requests.

def fix_route(route_name, getter_code):
    pattern = r'(@app\.route\(' + route_name + r'.*?\ndef [a-zA-Z_]+\(.*?\):\n(?:    .*\n)*)(?=\n@app\.route|\Z)'
    match = re.search(pattern, code, re.DOTALL)
    if match:
        body = match.group(1)
        # remove get_current_user_data block
        body = body.replace("    user_data, users = get_current_user_data()\n    if user_data is None:\n        return jsonify({'error': 'User not authenticated.'}), 401\n",
                            "    user_data, users = get_current_user_data()\n    if user_data is None:\n        return jsonify({'error': 'User not authenticated.'}), 401\n" + getter_code)
        
        # for session_state, it's slightly different
        body = body.replace("    user_data, users = get_current_user_data()\n    if user_data is None:\n        return jsonify({'logged_in': False})\n",
                            "    user_data, users = get_current_user_data()\n    if user_data is None:\n        return jsonify({'logged_in': False})\n" + getter_code)
        
        return body
    return ""

def replace_in_code(code):
    # session_state
    ss = fix_route("'/session_state'", "    topic = request.args.get('topic', 'fractions')\n")
    if ss:
        ss_new = ss.replace("load_brain_from_user_state(user_data)", "load_brain_from_user_state(user_data, topic)")
        ss_new = ss_new.replace("'diagnostic_completed'", f"f'diagnostic_completed_{{topic}}'")
        ss_new = ss_new.replace("'diagnostic_index'", f"f'diagnostic_index_{{topic}}'")
        ss_new = ss_new.replace("'topic_intro_seen_fractions'", f"f'topic_intro_seen_{{topic}}'")
        ss_new = ss_new.replace("'current_action'", f"f'current_action_{{topic}}'")
        ss_new = ss_new.replace("'seen_questions_fractions'", f"f'seen_questions_{{topic}}'")
        ss_new = ss_new.replace("'topic': 'fractions'", "f'topic': topic")
        ss_new = ss_new.replace("'video_url': FRACTIONS_VIDEO_URL", "'video_url': FRACTIONS_VIDEO_URL if topic == 'fractions' else 'https://www.youtube.com/embed/9lS8E_sYnFA'")
        code = code.replace(ss, ss_new)

    # mark_topic_intro_seen
    mt = fix_route("'/mark_topic_intro_seen'", "    data = request.json or {}\n    topic = data.get('topic', 'fractions')\n")
    if mt:
        # It already extracts `data = request.json or {}` and `topic = data.get('topic', 'fractions')`! 
        # Just need to replace `_fractions` globally within the function body!
        mt = mt.replace("    data = request.json or {}\n    topic = data.get('topic', 'fractions')\n", "") # it's already there
        mt_new = mt.replace("load_brain_from_user_state(user_data)", "load_brain_from_user_state(user_data, topic)")
        mt_new = mt_new.replace("if topic == 'fractions':", "")
        mt_new = mt_new.replace("user_data['topic_intro_seen_fractions'] = True", "user_data[f'topic_intro_seen_{topic}'] = True")
        mt_new = mt_new.replace("'topic': 'fractions'", "f'topic': topic")
        mt_new = mt_new.replace("'current_action'", f"f'current_action_{{topic}}'")
        mt_new = mt_new.replace("'attempt_count_current_action'", f"f'attempt_count_current_action_{{topic}}'")
        mt_new = mt_new.replace("'seen_questions_fractions'", f"f'seen_questions_{{topic}}'")
        code = code.replace(mt, mt_new)

    # configure_student
    cs = fix_route("'/configure_student'", "    topic = request.args.get('topic', 'fractions')\n")
    if cs:
        cs_new = cs.replace("load_brain_from_user_state(user_data)", "load_brain_from_user_state(user_data, topic)")
        cs_new = cs_new.replace("user_data['learning_profile'] = profile_data", "")
        cs_new = cs_new.replace("brain.configure_profile(profile_data)", "user_data['learning_profile'] = profile_data; brain.configure_profile(profile_data)")
        
        cs_new = cs_new.replace("'diagnostic_index'", f"f'diagnostic_index_{{topic}}'")
        cs_new = cs_new.replace("'diagnostic_correct'", f"f'diagnostic_correct_{{topic}}'")
        cs_new = cs_new.replace("'diagnostic_time_sum'", f"f'diagnostic_time_sum_{{topic}}'")
        cs_new = cs_new.replace("'diagnostic_completed'", f"f'diagnostic_completed_{{topic}}'")
        cs_new = cs_new.replace("'current_action'", f"f'current_action_{{topic}}'")
        cs_new = cs_new.replace("'brain_state'", f"f'brain_state_{{topic}}'")
        cs_new = cs_new.replace("'topic': 'fractions'", "f'topic': topic")
        cs_new = cs_new.replace("'attempt_count_current_action'", f"f'attempt_count_current_action_{{topic}}'")
        cs_new = cs_new.replace("'seen_questions_fractions'", f"f'seen_questions_{{topic}}'")
        code = code.replace(cs, cs_new)
        
    # submit_diagnostic
    sd = fix_route("'/submit_diagnostic'", "    data = request.json or {}\n    topic = data.get('topic', 'fractions')\n")
    if sd:
        sd = sd.replace("    data = request.json or {}\n", "")
        sd_new = sd.replace("load_brain_from_user_state(user_data)", "load_brain_from_user_state(user_data, topic)")
        sd_new = sd_new.replace("'diagnostic_completed'", f"f'diagnostic_completed_{{topic}}'")
        sd_new = sd_new.replace("'current_action'", f"f'current_action_{{topic}}'")
        sd_new = sd_new.replace("'diagnostic_correct'", f"f'diagnostic_correct_{{topic}}'")
        sd_new = sd_new.replace("'diagnostic_time_sum'", f"f'diagnostic_time_sum_{{topic}}'")
        sd_new = sd_new.replace("'diagnostic_index'", f"f'diagnostic_index_{{topic}}'")
        sd_new = sd_new.replace("'topic_intro_seen_fractions'", f"f'topic_intro_seen_{{topic}}'")
        sd_new = sd_new.replace("'attempt_count_current_action'", f"f'attempt_count_current_action_{{topic}}'")
        sd_new = sd_new.replace("'seen_questions_fractions'", f"f'seen_questions_{{topic}}'")
        sd_new = sd_new.replace("'brain_state'", f"f'brain_state_{{topic}}'")
        sd_new = sd_new.replace("'topic': 'fractions'", "f'topic': topic")
        sd_new = sd_new.replace("'video_url': FRACTIONS_VIDEO_URL", "'video_url': FRACTIONS_VIDEO_URL if topic == 'fractions' else 'https://www.youtube.com/embed/9lS8E_sYnFA'")
        code = code.replace(sd, sd_new)

    # submit_answer
    sa = fix_route("'/submit_answer'", "    data = request.json or {}\n    topic = data.get('topic', 'fractions')\n")
    if sa:
        sa = sa.replace("    data = request.json or {}\n", "")
        sa_new = sa.replace("load_brain_from_user_state(user_data)", "load_brain_from_user_state(user_data, topic)")
        sa_new = sa_new.replace("'diagnostic_completed'", f"f'diagnostic_completed_{{topic}}'")
        sa_new = sa_new.replace("'current_action'", f"f'current_action_{{topic}}'")
        sa_new = sa_new.replace("'hint_used_current_action'", f"f'hint_used_current_action_{{topic}}'")
        sa_new = sa_new.replace("'hint_count_current_action'", f"f'hint_count_current_action_{{topic}}'")
        sa_new = sa_new.replace("'attempt_count_current_action'", f"f'attempt_count_current_action_{{topic}}'")
        sa_new = sa_new.replace("'brain_state'", f"f'brain_state_{{topic}}'")
        sa_new = sa_new.replace("'questions_since_last_upload_fractions'", f"f'questions_since_last_upload_{{topic}}'")
        sa_new = sa_new.replace("'seen_questions_fractions'", f"f'seen_questions_{{topic}}'")
        sa_new = sa_new.replace("'topic': 'fractions'", "f'topic': topic")
        code = code.replace(sa, sa_new)

    # get_hint
    gh = fix_route("'/get_hint'", "    data = request.json or {}\n    topic = data.get('topic', 'fractions')\n")
    if gh:
        gh = gh.replace("    data = request.json or {}\n", "")
        gh_new = gh.replace("load_brain_from_user_state(user_data)", "load_brain_from_user_state(user_data, topic)")
        gh_new = gh_new.replace("'current_action'", f"f'current_action_{{topic}}'")
        gh_new = gh_new.replace("'hint_used_current_action'", f"f'hint_used_current_action_{{topic}}'")
        gh_new = gh_new.replace("'hint_count_current_action'", f"f'hint_count_current_action_{{topic}}'")
        gh_new = gh_new.replace("'topic': 'fractions'", "f'topic': topic")
        code = code.replace(gh, gh_new)

    # upload_work
    uw = fix_route("'/upload_work'", "    topic = request.form.get('topic', 'fractions')\n")
    if uw:
        uw_new = uw.replace("load_brain_from_user_state(user_data)", "load_brain_from_user_state(user_data, topic)")
        uw_new = uw_new.replace("'questions_since_last_upload_fractions'", f"f'questions_since_last_upload_{{topic}}'")
        uw_new = uw_new.replace("'seen_questions_fractions'", f"f'seen_questions_{{topic}}'")
        uw_new = uw_new.replace("'current_action'", f"f'current_action_{{topic}}'")
        uw_new = uw_new.replace("'brain_state'", f"f'brain_state_{{topic}}'")
        code = code.replace(uw, uw_new)
        
    return code

new_code = replace_in_code(code)

with open('app.py', 'w', encoding='utf-8') as f:
    f.write(new_code)
