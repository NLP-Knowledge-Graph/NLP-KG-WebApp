from typing import Annotated

from app.services import encoder_service, reranker_service
from fastapi import APIRouter, Query

router = APIRouter()


@router.get("/publications")
def get_publication(
        query_string: str,
        offset: int = 0,
        limit: int = 10,
        n_papers_from_weaviate: int = 2000,
        alpha: float = 0.8,
        field_filters: Annotated[list[str], Query()] = [],
        sort_option: str = "relevancy",
        search_type: str = "default",
        min_date_filter: int = 1, 
        max_date_filter: int = 99999, 
        min_citation_filter: int = 0, 
        venue_filters: Annotated[list[str], Query()] = [],
        survey_filter: bool | None = None,
        ):
    
    return reranker_service.query(
        query_string,
        offset=offset,
        limit=limit,
        n_papers_from_weaviate=n_papers_from_weaviate,
        alpha=alpha,
        field_filters=field_filters,
        sort_option=sort_option,
        search_type=search_type,
        min_date_filter = min_date_filter,
        max_date_filter = max_date_filter,
        min_citation_filter = min_citation_filter,
        venue_filter = venue_filters,
        survey_filter = survey_filter
    )

@router.get("/embeddings")
def get_embeddings(query_string: str):
    result = encoder_service.get_embeddings(query_string)
    return result
