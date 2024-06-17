import logging

from app.controller import query_controller, neo4j_controller, weaviate_controller
from app.middleware import time_middleware
from fastapi import FastAPI

logging.config.fileConfig("logging.conf", disable_existing_loggers=False)
logger = logging.getLogger(__name__)

logger.info("Application Started")

app = FastAPI(title="NLP-KG Retrieval API", docs_url="/")

app.add_middleware(time_middleware.TimeMiddleware)

app.include_router(query_controller.router, prefix="/v1/query", tags=["Query"])
app.include_router(neo4j_controller.router, prefix="/v1/neo4j", tags=["Neo4j"])
app.include_router(weaviate_controller.router,
                   prefix="/v1/weaviate", tags=["Weaviate"])
