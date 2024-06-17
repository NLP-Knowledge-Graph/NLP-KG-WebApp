import logging
from typing import Any, Mapping

import weaviate
from weaviate.gql.get import HybridFusion
from app.services import encoder_service
from app.utils.types import Publication

from ..utils.env import WEAVIATE_URI

# Set up logging
logger = logging.getLogger(__name__)


def to_publication(data: Mapping[str, Any]) -> Publication:
    result = Publication()
    for key, key_type in Publication.__annotations__.items():
        if key not in data:
            logger.error(data)
            raise ValueError(f"Key: {key} is not available in data.")
        result[key] = key_type(data[key])
    return result

try:
    client = weaviate.Client(WEAVIATE_URI)
    client.batch.configure(
        batch_size=400,
        dynamic=True,
    )
except:
    logger.error("Can't connect to Weaviate")


def health_check_weaviate() -> bool:
    logger.info("Checking Weaviate readiness...")
    return client.is_ready()


def get_publications(query: str, limit=10, offset=0, alpha=0.8, field_filters=[], search_type: str = "default", min_date_filter=1, max_date_filter=99999, min_citation_filter=0, venue_filter=[], survey_filter: bool | None = None) -> list[Publication]:
    """
    Offset = page * limit
    """
    try:
        operands = [
            {
                "path": ["n_citations"],
                "operator": "GreaterThanEqual",
                "valueInt": min_citation_filter
            },
            {
                "path": ["year"],
                "operator": "GreaterThanEqual",
                "valueInt": min_date_filter
            },
            {
                "path": ["year"],
                "operator": "LessThanEqual",
                "valueInt": max_date_filter
            },
        ]

        if len(venue_filter) != 0:
            operands.append({
                "path": ["venue"],
                "operator": "ContainsAny",
                "valueStringArray": venue_filter
            })

        if len(field_filters) != 0:
            operands.append({
                "path": ["field_list"],
                "operator": "ContainsAny",
                "valueStringArray": field_filters
            })

        if survey_filter is True:
            operands.append({
                "path": ["survey"],
                "operator": "Equal",
                "valueBoolean": True
            })

        get_builder = client.query.get(
            "Publication",
            ["neo4jID",
             "title",
             "abstract",
             "venue",
             "venue_name",
             "authors",
             "year",
             "n_citations",
             "n_key_citations",
             "field_list",
             "publication_date"],
        )

        if search_type == "default":
            embeddings = encoder_service.get_embeddings(query)
            response = (get_builder
                        .with_additional(["score"])
                        .with_hybrid(query=query, alpha=alpha, vector=embeddings,
                                     properties=["title", "abstract", "authors", "venue", "venue_name"], fusion_type=HybridFusion.RELATIVE_SCORE)
                        # Remove authors and venue? Or add abstract?
                        .with_where({"operator": "And", "operands": operands})
                        .with_limit(limit)
                        .with_offset(offset)
                        .do()
                        )
        elif search_type == "string":
            search_operands = {"operator": "Or",
                               "operands": [
                                   {
                                       "path": ["title"],
                                       "operator": "Like",
                                       "valueText": "*" + query + "*"
                                   },
                                   {
                                       "path": ["venue"],
                                       "operator": "Like",
                                       "valueText": "*" + query + "*"
                                   },
                                   {
                                       "path": ["venue_name"],
                                       "operator": "Like",
                                       "valueText": "*" + query + "*"
                                   },
                                   {
                                       "path": ["authors"],
                                       "operator": "Like",
                                       "valueText": "*" + query + "*"
                                   }]}
            operands.append(search_operands)

            response = (get_builder
                        .with_additional(["score"])
                        .with_where({"operator": "And", "operands": operands})
                        .with_limit(limit)
                        .do()
                        )

        result = response["data"]["Get"]["Publication"]
        papers = list(map(to_publication, result))

        return papers
    except Exception as e:
        logger.error(e)
        return {}
