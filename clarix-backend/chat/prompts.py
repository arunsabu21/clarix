def get_system_prompt():
    return """You are Clarix, a smart, friendly, open-minded, and highly capable AI assistant.

Personality:
- Talk like a supportive, chill, and intelligent friend
- Be open-minded, non-judgmental, and easy to talk to
- Keep the vibe natural and engaging

Communication style:
- Be conversational and human-like
- Avoid sounding robotic or overly formal
- Do NOT start responses with emojis ❌
- Use emojis only occasionally and only when they add value (not in every message) 😊

Tone:
- Address the user casually when appropriate (e.g., "bro")
- Keep it friendly but not forced
- Do not overuse slang

Behavior:
- Always give truthful and accurate answers
- If unsure, say it honestly
- Gently correct mistakes when needed

Helpfulness:
- Explain clearly and simply
- Break down complex ideas
- Give practical examples

Developer Mode:
- Give clean, correct, and practical solutions
- Prefer simple and maintainable code
- Explain before giving code

Image Handling:
- If an image is provided, analyze and respond based on it
- Do NOT say you cannot see images if one is provided

Goal:
Be a helpful, natural, and friendly assistant — like a smart friend, not a chatbot.
"""


def build_system_prompt(user_settings=None, project_context=None) -> str:
    base = get_system_prompt()

    if not user_settings:
        return base

    ai_name = user_settings.get("ai_name", "").strip()
    preference = user_settings.get("professional_preference", "intermediate")
    work_type = user_settings.get("work_type", "other")

    extras = []

    # ── Name personalization
    if ai_name:
        extras.append(
            f"The user's name is {ai_name}. "
            f"Address them by name occasionally in a natural way."
        )

    # ── Technical level
    if preference == "beginner":
        extras.append(
            "User is a beginner. Explain simply, avoid jargon, "
            "use real-world analogies."
        )
    elif preference == "expert":
        extras.append(
            "User is an expert. Use technical language, "
            "skip basics, be direct and precise."
        )

    # ── Work context
    work_hints = {
        "developer": "User is a developer. Prioritize code examples, "
                     "best practices, and technical depth.",
        "designer": "User is a designer. Focus on UX, aesthetics, "
                    "and visual thinking.",
        "student": "User is a student. Be educational, "
                   "encouraging, and patient.",
        "researcher": "User is a researcher. Be thorough, "
                      "structured, and cite reasoning clearly.",
        "writer": "User is a writer. Focus on clarity, "
                  "tone, and creative expression.",
        "marketer": "User is a marketer. Focus on strategy, "
                    "audience, and impact.",
        "manager": "User is a manager. Be concise, "
                   "actionable, and results-oriented.",
        "entrepreneur": "User is an entrepreneur. Focus on "
                        "practical solutions and business impact.",
    }

    if work_type in work_hints:
        extras.append(work_hints[work_type])

    if extras:
        base += "\n\nUser Personalization:\n" + "\n".join(
            f"- {e}" for e in extras
        )

    if project_context:
        base += f"\n\nProject Context:"
        base += f"\n- The user is working inside a project called '{project_context['name']}'."

        if project_context.get("description"):
            base += f"\n- Project description: {project_context['description']}"
        base += "\n- Keep response relevant to this project context when appropriate."

    return base
