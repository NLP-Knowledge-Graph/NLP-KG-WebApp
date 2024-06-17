from time import perf_counter
from app.services import weaviate_service
import logging
from frozendict import frozendict
from .s2search.rank import S2Ranker
from os.path import abspath
from functools import lru_cache

# point to the artifacts downloaded from s3
data_dir = abspath('/code/data/s2search')

logger = logging.getLogger(__name__)

# only do this once because we have to load the giant language models into memory
s2ranker = S2Ranker(data_dir)


# Actual (non-helper) methods start here
def query(query_string: str, offset: int, limit: int, n_papers_from_weaviate: int, alpha: float, field_filters: list, sort_option: str, search_type: str, min_date_filter: int, max_date_filter: int, min_citation_filter: int, venue_filter: list, survey_filter = bool | None):
    papers = get_publications_cached(
        query_string, n_papers_from_weaviate, alpha, tuple(field_filters), search_type, min_date_filter, max_date_filter, min_citation_filter, tuple(venue_filter), survey_filter)

    if not papers: 
        logger.info("No matching papers with the given query")
        return
    
    paper_list: tuple[frozendict]

    match sort_option:
        case "relevancy":
            paper_list = reranker_relevancy(papers, query_string)
        case "recency":
            paper_list = reranker_recency(papers)
        case "citation":
            paper_list = reranker_citations(papers)
        case "influential":
            paper_list = reranker_influential(papers)
        case _:
            logger.error("Error Unrecognized Sort Option:", sort_option)
    
    total = len(paper_list)

    statsDict = {}
    for d in paper_list:
        key = d["year"]
        statsDict.setdefault(key, 0)
        statsDict[key] += 1

    # Get the specified papers from index <Offset> to <Offset+limit>
    return {
        "papers": paper_list[offset:offset+limit],
        "hasNext": total > offset + limit,
        "total": total,
        "statistics": statsDict,
    }

@lru_cache
def reranker_recency(papers: tuple[frozendict]) -> tuple[frozendict]:
    result = sorted(
        list(papers), key=lambda x: x["publication_date"], reverse=True)
    return tuple(result)


@lru_cache
def reranker_citations(papers: tuple[frozendict]) -> tuple[frozendict]:
    result = sorted(list(papers), key=lambda x: x["n_citations"], reverse=True)
    return tuple(result)

@lru_cache
def reranker_influential(papers: tuple[frozendict]) -> tuple[frozendict]:
    result = sorted(list(papers), key=lambda x: x["n_key_citations"], reverse=True)
    return tuple(result)

@lru_cache
def reranker_relevancy(papers: tuple[frozendict], query_string: str) -> tuple[frozendict]:
    t_start = perf_counter()
    paper_ranks = s2ranker.score(query_string, list(papers))
    logger.info(f"Score Time: {perf_counter() - t_start}")

    sorted_result = sorted(enumerate(paper_ranks),
                           key=lambda x: x[1], reverse=True)

    result = []
    for index, rank in sorted_result:
        paper = papers[index]
        result.append(paper)

    return tuple(result)


# @list_to_tuple
@lru_cache
def get_publications_cached(query_string: str, n_papers_from_weaviate: int, alpha: float, field_filters: tuple[str], search_type: str, min_date_filter: int, max_date_filter: int, min_citation_filter: int, venue_filter: tuple[str], survey_filter: bool | None) -> tuple[frozendict]:
    t_start = perf_counter()

    papers = weaviate_service.get_publications(
        query_string,
        alpha=alpha,
        limit=n_papers_from_weaviate,
        field_filters=list(field_filters),
        search_type=search_type,
        min_date_filter=min_date_filter,
        max_date_filter=max_date_filter,
        min_citation_filter=min_citation_filter,
        venue_filter=list(venue_filter),
        survey_filter=survey_filter)

    logger.info(f"Weaviate: {perf_counter() - t_start}")
    return tuple([frozendict(paper) for paper in papers])
