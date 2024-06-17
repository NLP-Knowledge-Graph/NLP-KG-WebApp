from typing import Annotated, List
from fastapi import APIRouter, BackgroundTasks, Query

from app.services import weaviate_service, weaviate_sync_service

router = APIRouter()


@router.get("/health", response_model=bool)
def health() -> bool:
    return weaviate_service.health_check_weaviate()


@router.post("/sync", response_model=str)
def initiate_sync(background_tasks: BackgroundTasks):
    background_tasks.add_task(weaviate_sync_service.start_sync)
    return "Sync started"


@router.get("/publications")
def get_publication(query_string: str, 
                    limit: int = 10, 
                    offset: int = 0,
                    alpha: float = 0.8,
                    field_filters: Annotated[list[str], Query()] = [], 
                    search_type: str = "default", 
                    min_date_filter: int = 1, 
                    max_date_filter: int = 99999, 
                    min_citation_filter: int = 0, 
                    venue_filters: Annotated[list[str], Query()] = []):
    
    return weaviate_service.get_publications(
        query_string,
        limit=limit,
        offset=offset,
        alpha=alpha,
        search_type= search_type,
        field_filters=field_filters,
        min_date_filter=min_date_filter,
        max_date_filter=max_date_filter,
        min_citation_filter=min_citation_filter,
        venue_filter=venue_filters
    )
