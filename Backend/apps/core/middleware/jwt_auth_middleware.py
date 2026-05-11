from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import UntypedToken
from django.conf import settings
from jwt import decode as jwt_decode

from apps.accounts.models import User


class JWTAuthMiddleware(BaseMiddleware):

    async def __call__(self, scope, receive, send):
        print(f"DEBUG: JWTAuthMiddleware received connection request to {scope.get('path')}")
        query_string = scope.get("query_string").decode()
        query_params = parse_qs(query_string)

        token = query_params.get("token")

        if token:
            token = token[0]
            # Strip 'Bearer ' if it was accidentally included
            if token.startswith("Bearer "):
                token = token.split(" ")[1]

            try:
                # Basic validation
                UntypedToken(token)

                decoded_data = jwt_decode(
                    token,
                    settings.SECRET_KEY,
                    algorithms=["HS256"]
                )

                # 🛡️ Resilient Extraction: Try common user ID claims
                user_id = decoded_data.get("user_id") or decoded_data.get("id") or decoded_data.get("sub")
                
                if not user_id:
                    print(f"DEBUG: WebSocket Auth Fail -> No user ID found in token claims: {decoded_data.keys()}")
                    scope["user"] = AnonymousUser()
                    return await self.inner(scope, receive, send)

                from channels.db import database_sync_to_async
                user = await database_sync_to_async(User.objects.get)(id=user_id)
                scope["user"] = user

            except Exception as e:
                print(f"DEBUG: WebSocket Auth Error -> {str(e)}")
                scope["user"] = AnonymousUser()
        else:
            scope["user"] = AnonymousUser()

        return await self.inner(scope, receive, send)