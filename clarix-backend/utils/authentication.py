from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from utils.token_cache import is_token_blacklisted


class CachedJWTAuthentication(JWTAuthentication):
    def get_validated_token(self, raw_token):
        token = super().get_validated_token(raw_token)

        jti = token.get("jti")
        if jti and is_token_blacklisted(jti):
            raise InvalidToken("Token has been blacklisted")

        return token
