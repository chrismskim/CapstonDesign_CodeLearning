from fastapi import APIRouter
from .endpoints import calling

router = APIRouter()

router.include_router(calling.router, tags=["calling"])

# Include other routers here as you add them