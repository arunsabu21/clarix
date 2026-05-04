from google import genai
from google.genai import types
from groq import Groq
from openai import OpenAI
from django.conf import settings
import base64
from chat.prompts import get_system_prompt, build_system_prompt
from chat.services.web_search import should_search, web_search, format_search_context

# Config Gemini (new SDK)
client_gemini = genai.Client(api_key=settings.GEMINI_API_KEY)

# OpenRouter
client_openrouter = OpenAI(
    api_key=settings.OPENROUTER_API_KEY,
    base_url=settings.OPENROUTER_BASE_URL,
)


def chat_with_gemini(
    messages: list,
    image_data: str = None,
    image_mime: str = None,
    user_settings: dict = None,
) -> str:
    """Primary LLM - Gemini 2.0 Flash"""
    try:
        system_prompt = build_system_prompt(user_settings)
        # Format history
        contents = []

        for i, msg in enumerate(messages):
            role = "user" if msg["role"] == "user" else "model"

            is_last_user = (
                msg["role"] == "user"
                and i == len(messages) - 1
                and image_data
                and image_mime
            )

            if is_last_user:
                parts = [
                    types.Part(
                        inline_data=types.Blob(
                            mime_type=image_mime,
                            data=base64.b64decode(image_data),
                        )
                    ),
                    types.Part(text=msg["content"] or "What is in this image?"),
                ]
            else:
                parts = [types.Part(text=msg["content"])]

            contents.append(types.Content(role=role, parts=parts))

        response = client_gemini.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                max_output_tokens=1024,
            ),
        )
        return response.text

    except Exception as e:
        print(f"Gemini Error: {e}")
        return chat_with_groq(messages, user_settings)  # Fallback


def chat_with_groq(messages: list, user_settings: dict = None) -> str:
    """Fallback LLM - Groq"""
    try:
        client = Groq(api_key=settings.GROQ_API_KEY)

        system_prompt = build_system_prompt(user_settings)
        formatted = [{"role": "system", "content": system_prompt}]
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


def chat_with_openrouter(messages: list, user_settings: dict = None) -> str:
    """Fallback LLM - OpenRouter"""
    try:
        system_prompt = build_system_prompt(user_settings)
        formatted = [{"role": "system", "content": system_prompt}]

        for msg in messages:
            formatted.append({"role": msg["role"], "content": msg["content"]})

        response = client_openrouter.chat.completions.create(
            model="openai/gpt-3.5-turbo",
            messages=formatted,
            max_tokens=1024,
        )
        return response.choices[0].message.content

    except Exception as e:
        print(f"OpenRouter Error: {e}")
        raise Exception("OpenRouter Failed")


def get_ai_response(
    messages: list,
    model: str = "gemini",
    image_data: str = None,
    image_mime: str = None,
    user_settings: dict = None,
    enable_search: bool = True,
) -> str:
    """Main entry point - tries Gemini first, falls back to Groq"""
    
    search_context = ""
    search_performed = ""
    
    if enable_search and messages:
        last_user_msg = ""
        for msg in reversed(messages):
            if msg["role"] == "user":
                last_user_msg = msg.get("content", "")
                break
        
        if last_user_msg and should_search(last_user_msg):
            print(f"Web search triggered for: {last_user_msg[:50]}")
            search_data = web_search(last_user_msg)
            
            if search_data["success"] and search_data["results"]:
                search_context = format_search_context(search_data)
                search_performed = True
                print(f"Search done: {len(search_data['results'])} results")
    
    messages_with_context = messages.copy()
    if search_context and messages_with_context:
        for i in range(len(messages_with_context) -1, -1, -1):
            if messages_with_context[i]["role"] == "user":
                original = messages_with_context[i]["content"]
                messages_with_context[i] = {
                    "role": "user",
                    "content": f"{search_context}\\n\\nUser question: {original}",
                }
                break

    if model == "groq":
        return chat_with_groq(messages_with_context, user_settings)
    elif model == "openrouter":
        return chat_with_openrouter(messages_with_context, user_settings)

    try:
        return chat_with_gemini(messages_with_context, image_data, image_mime, user_settings)

    except Exception as e:
        print(f"Gemini Failed: {e}")

        try:
            return chat_with_groq(messages_with_context, user_settings)

        except Exception as e:
            print(f"Groq Failed: {e}")

            return chat_with_openrouter(messages_with_context, user_settings)
