from fastapi import APIRouter

from app.services import neo4j_service


router = APIRouter()

@router.get("/health", response_model=bool)
def health() -> bool:
    return neo4j_service.health_check_neo4j()

@router.get("/query", response_model=list[dict[str, object]])
def query(query_string: str) -> list[dict[str, object]]:
    return neo4j_service.use_neo4j(query_string)
