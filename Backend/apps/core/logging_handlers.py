import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

class WebSocketLogHandler(logging.Handler):
    """
    A custom logging handler that broadcasts log records to a 
    Channels group named 'system_logs'.
    """
    def emit(self, record):
        try:
            # Format the record
            log_entry = self.format(record)
            
            # Send to channels group
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    "system_logs",
                    {
                        "type": "log_message",
                        "message": {
                            "text": log_entry,
                            "logger": record.name
                        }
                    }
                )
        except Exception:
            # Avoid infinite loops or crashing if Channels is down
            self.handleError(record)
