from app.routes.auth import router as auth_router
from app.routes.rfqs import router as rfqs_router
from app.routes.quotations import router as quotations_router
from app.routes.rankings import router as rankings_router
from app.routes.activity import router as activity_router
from app.routes.dashboard import router as dashboard_router

__all__ = [
    "auth_router",
    "rfqs_router",
    "quotations_router",
    "rankings_router",
    "activity_router",
    "dashboard_router",
]
