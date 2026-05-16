from django.core.cache import cache
import logging

app_logger = logging.getLogger("app")

class PresenceService:
    """
    Handles real-time presence tracking using Redis.
    Uses native Redis SET operations via django-redis client.
    """
    KEY_PREFIX = "presence:user:"
    SET_KEY = "presence:online_users"

    @classmethod
    def clear_all(cls):
        """Emergency reset of all presence data."""
        client = cls.get_client()
        if client:
            client.delete(cls.SET_KEY)
            # Find and delete all user connection keys
            keys = client.keys(f"{cls.KEY_PREFIX}*")
            if keys:
                client.delete(*keys)
            app_logger.warning("Presence: GLOBAL RESET executed.")
            return True
        return False

    @classmethod
    def get_client(cls):
        """Access the underlying Redis client from django-redis."""
        try:
            if hasattr(cache, "client") and hasattr(cache.client, "get_client"):
                return cache.client.get_client()
        except Exception as e:
            app_logger.error(f"Presence: Redis Raw Client fallback triggered: {str(e)}")
        return None

    PULSE_PREFIX = "presence:pulse:"

    @classmethod
    def update_pulse(cls, user_id):
        """Register a heartbeat pulse for the user."""
        uid = int(user_id)
        # Store current unix timestamp
        import time
        now = int(time.time())
        cache.set(f"{cls.PULSE_PREFIX}{uid}", now, 90) # Pulse lasts 90s
        return now

    @classmethod
    def touch_presence(cls, user_id, channel_name):
        """Heartbeat: Keep this SPECIFIC connection key alive."""
        key = f"{cls.KEY_PREFIX}{user_id}:{channel_name}"
        if cache.get(key):
            cache.touch(key, 60)
            return True
        # If it expired, we need to re-register
        return cls.go_online(user_id, channel_name)

    @classmethod
    def go_online(cls, user_id, channel_name):
        """Track a new unique connection for a user."""
        uid = int(user_id)
        key = f"{cls.KEY_PREFIX}{uid}:{channel_name}"
        
        # 💓 [PULSE] Immediately pulse on connection
        cls.update_pulse(uid)
        
        # Mark this specific connection as active
        cache.set(key, 1, 60)
        
        # Ensure user is in the global online set
        client = cls.get_client()
        if client:
            client.sadd(cls.SET_KEY, uid)
        else:
            online_ids_data = cache.get(cls.SET_KEY)
            online_ids = set(online_ids_data) if online_ids_data else set()
            online_ids.add(uid)
            cache.set(cls.SET_KEY, list(online_ids), 86400)

        print(f"🔴 [PRESENCE] User {uid} CONNECTED Tab: {channel_name[-8:]}")
        return True

    @classmethod
    def go_offline(cls, user_id, channel_name):
        """Remove a specific connection, and go offline if it's the last one."""
        uid = int(user_id)
        key_to_del_suffix = f"{cls.KEY_PREFIX}{uid}:{channel_name}"
        
        # 1. Clean this specific record
        client = cls.get_client()
        if client:
            client.delete(f"{cls.KEY_PREFIX}{uid}:{channel_name}")
        else:
            all_keys = list(cache._cache.keys())
            for k in all_keys:
                if key_to_del_suffix in k:
                    cache.delete(k.replace(":1:", ""))
        
        # 2. Check for other surviving tabs
        search_pattern = f"{cls.KEY_PREFIX}{uid}:"
        all_keys = list(cache._cache.keys()) if not client else []
        if client:
            try: remaining_keys = client.keys(f"{search_pattern}*")
            except: remaining_keys = []
        else:
            remaining_keys = [k for k in all_keys if search_pattern in k]

        survivors = len(remaining_keys)

        # 3. [SHIELD] Only shield if there are OTHER active tabs
        import time
        pulse_time = cache.get(f"{cls.PULSE_PREFIX}{uid}", 0)
        pulse_age = int(time.time()) - pulse_time
        
        # Shield remains active if there's another tab OR is very fresh pulse (< 40s)
        # BUT only if we think there might be another connection.
        if survivors > 0:
            print(f"🛡️ [PRESENCE] User {uid} Shielded (Tabs: {survivors}, Pulse: {pulse_age}s)")
            return False

        # If we get here, survivors == 0. 
        # Is the pulse so fresh it might be a new tab that hasn't registered its session key yet?
        # A 5-second window is enough for a New Connection to land.
        if pulse_age < 5:
            print(f"⏳ [PRESENCE] User {uid} Grace cooling (Pulse: {pulse_age}s)")
            return False

        # 4. FINAL DISCONNECT: No tabs, pulse is cooling or old.
        print(f"💀 [PRESENCE] User {uid} FULL DISCONNECT. Pulse: {pulse_age}s. Survivors: 0.")
        
        # 🧹 VAPORIZE: Clear pulse and online set immediately
        cache.delete(f"{cls.PULSE_PREFIX}{uid}")
        
        if client:
            try: client.srem(cls.SET_KEY, uid)
            except: pass
        else:
            online_ids_data = cache.get(cls.SET_KEY)
            online_ids = set(online_ids_data) if online_ids_data else set()
            if uid in online_ids:
                online_ids.remove(uid)
                cache.set(cls.SET_KEY, list(online_ids), 86400)
        return True 

    @classmethod
    def get_online_user_ids(cls):
        """Get verified online users using Pulse-Based Truth."""
        client = cls.get_client()
        import time
        now = int(time.time())
        
        if client:
            try:
                raw_ids = client.smembers(cls.SET_KEY)
                candidate_ids = [int(u.decode('utf-8') if isinstance(u, bytes) else u) for u in raw_ids]
            except Exception:
                candidate_ids = cache.get(cls.SET_KEY, [])
        else:
            candidate_ids = cache.get(cls.SET_KEY, [])

        if not candidate_ids: return []

        valid_ids = []
        for uid in candidate_ids:
            uid = int(uid)
            pulse_time = cache.get(f"{cls.PULSE_PREFIX}{uid}", 0)
            age = now - pulse_time
            
            # User is online if their pulse is younger than 90 seconds
            if age < 90:
                valid_ids.append(uid)
            else:
                # Cleanup zombies that missed the go_offline call
                if client:
                    try: client.srem(cls.SET_KEY, uid)
                    except: pass
                else:
                    s = set(candidate_ids)
                    if uid in s:
                        s.remove(uid)
                        cache.set(cls.SET_KEY, list(s), 86400)
                        
        return valid_ids

    @classmethod
    def is_user_online(cls, user_id):
        """Check if a specific user is currently online."""
        try:
            return int(user_id) in cls.get_online_user_ids()
        except (ValueError, TypeError):
            return False
