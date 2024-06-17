import time

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


class TimeMiddleware(BaseHTTPMiddleware):
    def __init__(
            self,
            app,
    ):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        response = await call_next(request)
        process_time = time.perf_counter() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        return response
