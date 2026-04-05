from google import genai
from google.genai import types
from groq import Groq
from django.conf import settings

# Config Gemini (new SDK)
client_gemini = genai.Client(api_key=settings.GEMINI_API_KEY)

SYSTEM_PROMPT = """You are Clarix, a powerful and friendly AI assistant.
You are helpful, concise, and clear in your responses.
"""


def chat_with_gemini(messages: list) -> str:
    """Primary LLM - Gemini 2.0 Flash"""
    try:
        # Format history
        contents = []
        for msg in messages:
            contents.append(
                types.Content(
                    role="user" if msg["role"] == "user" else "model",
                    parts=[types.Part(text=msg["content"])],
                )
            )

        response = client_gemini.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                max_output_tokens=1024,
            ),
        )
        return response.text

    except Exception as e:
        print(f"Gemini error: {e}")
        return chat_with_groq(messages)  # Fallback


def chat_with_groq(messages: list) -> str:
    """Fallback LLM - Groq"""
    try:
        client = Groq(api_key=settings.GROQ_API_KEY)

        formatted = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in messages:
            formatted.append(
                {
                    "role": msg["role"],
                    "content": msg["content"],
                }
            )

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=formatted,
            max_tokens=1024,
        )
        return response.choices[0].message.content

    except Exception as e:
        print(f"Groq Error: {e}")
        raise Exception("Something went wrong. Please try again.")


def get_ai_response(messages: list, model: str = "gemini") -> str:
    """Main entry point - tries Gemini first, falls back to Groq"""
    if model == "groq":
        return chat_with_groq(messages)
    return chat_with_gemini(messages)
