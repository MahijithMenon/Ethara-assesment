import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import customers, dashboard, orders, products
from app.config import settings
from app.core.exceptions import register_exception_handlers
from app.database import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="1.0.0",
        debug=settings.DEBUG,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    app.include_router(products.router, prefix=settings.API_V1_PREFIX)
    app.include_router(customers.router, prefix=settings.API_V1_PREFIX)
    app.include_router(orders.router, prefix=settings.API_V1_PREFIX)
    app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)

    @app.get("/", tags=["health"])
    def root():
        return {"app": settings.APP_NAME, "status": "ok", "env": settings.APP_ENV}

    @app.get("/health", tags=["health"])
    def health():
        return {"status": "ok"}

    @app.on_event("startup")
    def _on_startup():
        logger.info("Starting %s (env=%s)", settings.APP_NAME, settings.APP_ENV)
        # quick DB smoke test
        try:
            with engine.connect() as conn:
                # use exec_driver_sql for a raw driver-level statement
                conn.exec_driver_sql("SELECT 1")
            logger.info("Database connection OK")
        except Exception as exc:  # pragma: no cover - runtime check
            logger.exception("Database connection failed on startup")
            raise

    return app


app = create_app()
