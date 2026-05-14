import asyncio
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/api", tags=["events"])

@router.get("/events")
async def events(request: Request):
    queue = asyncio.Queue()

    from ..database import add_sse_client, remove_sse_client
    add_sse_client(queue)

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30)
                    yield f"data: {event}\n\n"
                except asyncio.TimeoutError:
                    yield f": keepalive\n\n"
        finally:
            remove_sse_client(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
