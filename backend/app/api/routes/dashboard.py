from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.dashboard import DashboardStats
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardStats)
def get_dashboard(db: DbSession):
    return dashboard_service.get_dashboard_stats(db)
