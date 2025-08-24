from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio
app = FastAPI()
async def joke_stream():
    jokes = [
        "Why did the epoch halve? To reduce supply!",
        "Salt is scarce, but laughter is infinite."
    ]
    for joke in jokes:
        yield f"data: {joke}\n\n"
        await asyncio.sleep(2)
@app.get("/api/jokes/stream")
async def stream_jokes():
    return StreamingResponse(joke_stream(), media_type="text/event-stream")