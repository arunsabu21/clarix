import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import get_user_model
from .models import Conversation, Message
from .services.llm import get_ai_response
from urllib.parse import parse_qs
from utils.rate_limiter import is_rate_limited, get_rate_limit_key, RATE_LIMITS
import asyncio

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        # Authenticate via JWT from query string
        query_string = self.scope["query_string"].decode()
        params = parse_qs(query_string)
        token = params.get("token", [None])[0]

        if not token:
            await self.close(code=4001)
            return

        try:
            access_token = AccessToken(token)
            user_id = access_token.get("user_id")
            self.user = await self.get_user(user_id)
        except (TokenError, Exception):
            await self.close(code=4001)
            return

        if not self.user or not self.user.is_active:
            await self.close(code=4001)
            return

        self.stop_streaming = False
        self.streaming_task = None
        self.keep_alive = True
        await self.accept()

    async def ping(self):
        while self.keep_alive:
            try:
                await self.send(json.dumps({"type": "ping"}))
                await asyncio.sleep(30)
            except Exception:
                break

    async def disconnect(self, close_code):
        self.keep_alive = False

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)

            if data.get("type") == "stop":
                self.stop_streaming = True
                if self.streaming_task:
                    self.streaming_task.cancel()
                return

            self.stop_streaming = False
            user_message = data.get("message", "").strip()
            model = data.get("model", "gemini")
            conversation_id = data.get("conversation_id")
            image_data = data.get("image_data")
            image_mime = data.get("image_mime")

            if not user_message and not image_data:
                return

            wait = await self.check_rate_limit()
            if wait:
                config = RATE_LIMITS["ai_message"]
                message = config["message"].format(wait_time=wait)
                await self.send(
                    json.dumps(
                        {
                            "type": "error",
                            "message": message,
                        }
                    )
                )
                return  # stop — no API call

            # Get or create conversation
            conversation = await self.get_or_create_conversation(conversation_id)

            # Save user message
            await self.save_message(conversation, "user", user_message)

            # Send typing indicator
            await self.send(json.dumps({"type": "typing"}))

            # Build History
            history = await self.get_history(conversation)

            # Get AI response
            ai_response = await self.get_ai_response(
                history, model, image_data, image_mime
            )

            self.streaming_task = asyncio.ensure_future(
                self.stream_response(ai_response, conversation, user_message)
            )

        except Exception:
            await self.send(
                json.dumps(
                    {
                        "type": "error",
                        "message": "Something went wrong. Please try again.",
                    }
                )
            )

    async def stream_response(self, ai_response, conversation, user_message):
        streamed = ""
        try:
            words = ai_response.split(" ")

            for i, word in enumerate(words):
                streamed += word + (" " if i < len(words) - 1 else "")
                await self.send(
                    json.dumps(
                        {
                            "type": "stream",
                            "content": word + (" " if i < len(words) - 1 else ""),
                        }
                    )
                )
                await asyncio.sleep(0.04)

        except asyncio.CancelledError:
            pass

        finally:
            if streamed:
                await self.save_message(conversation, "assistant", streamed)

            await self.send(
                json.dumps(
                    {
                        "type": "done",
                        "conversation_id": str(conversation.id),
                        "title": conversation.title or user_message[:60],
                    }
                )
            )
            self.streaming_task = None

    @database_sync_to_async
    def check_rate_limit(self):
        config = RATE_LIMITS["ai_message"]
        key = get_rate_limit_key("ai_message", str(self.user.id))
        return is_rate_limited(key, config["limit"], config["window"])

    # ─────────────────────────────────────────
    # DB HELPERS
    # ─────────────────────────────────────────
    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def get_or_create_conversation(self, conversation_id):
        if conversation_id:
            try:
                return Conversation.objects.get(id=conversation_id, user=self.user)
            except Conversation.DoesNotExist:
                pass
        return Conversation.objects.create(user=self.user)

    @database_sync_to_async
    def get_history(self, conversation):
        messages = conversation.messages.all().order_by("created_at")
        return [{"role": m.role, "content": m.content} for m in messages]

    @database_sync_to_async
    def save_message(self, conversation, role, content):
        msg = Message.objects.create(
            conversation=conversation,
            role=role,
            content=content,
        )
        # Auto title
        if not conversation.title:
            msgs = conversation.messages.count()
            if msgs >= 1:
                first = conversation.messages.filter(role="user").first()
                if first:
                    conversation.title = first.content[:60]
                    conversation.save()
        return msg

    @database_sync_to_async
    def get_ai_response(self, history, model, image_data=None, image_mime=None):
        from .services.llm import get_ai_response as llm_response
        return llm_response(history, model, image_data, image_mime)
