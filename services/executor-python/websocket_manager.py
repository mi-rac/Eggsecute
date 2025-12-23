from typing import Dict, Set

from fastapi import WebSocket

from models import WebSocketEvent


JobSubscribers = Dict[str, Set[WebSocket]]

job_subscribers: JobSubscribers = {}


async def subscribe_to_job(job_id: str, ws: WebSocket) -> None:
    """Register a WebSocket as a subscriber for a given job."""
    subs = job_subscribers.setdefault(job_id, set())
    subs.add(ws)


async def unsubscribe_from_job(job_id: str, ws: WebSocket) -> None:
    """Remove a WebSocket subscription for a given job."""
    subs = job_subscribers.get(job_id)
    if not subs:
        return
    subs.discard(ws)
    if not subs:
        job_subscribers.pop(job_id, None)


async def broadcast_to_job(job_id: str, event: WebSocketEvent) -> None:
    """Send an event to all WebSocket clients subscribed to the given job."""
    subscribers = list(job_subscribers.get(job_id, set()))
    if not subscribers:
        return

    message = event.json()

    for ws in subscribers:
        try:
            await ws.send_text(message)
        except Exception:
            # Drop subscribers that can no longer be written to
            await unsubscribe_from_job(job_id, ws)

