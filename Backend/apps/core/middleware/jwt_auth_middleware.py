from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import UntypedToken
from django.conf import settings
from jwt import decode as jwt_decode

from apps.accounts.models import User


class JWTAuthMiddleware(BaseMiddleware):

    async def __call__(self, scope, receive, send):

        query_string = scope.get("query_string").decode()
        query_params = parse_qs(query_string)

        token = query_params.get("token")

        if token:
            token = token[0]

            try:
                UntypedToken(token)

                decoded_data = jwt_decode(
                    token,
                    settings.SECRET_KEY,
                    algorithms=["HS256"]
                )

                user = await User.objects.aget(id=decoded_data["user_id"])
                scope["user"] = user

            except Exception as e:
                print("JWT ERROR:", e)
                scope["user"] = AnonymousUser()
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)