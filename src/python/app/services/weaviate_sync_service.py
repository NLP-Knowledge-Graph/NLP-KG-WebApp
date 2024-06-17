import logging
import math
from multiprocessing import Queue
from queue import Empty
from threading import Thread
from time import perf_counter, sleep

import weaviate
from weaviate.util import generate_uuid5

from . import neo4j_service
from ..utils.env import WEAVIATE_URI

logger = logging.getLogger(__name__)

client = weaviate.Client(WEAVIATE_URI)
client.batch.configure(
    batch_size=400,
    dynamic=True,
)


def start_sync() -> None:
    client.schema.delete_all()
    client.schema.create_class(publication_class)
    # client.schema.create_class(field_class)

    queue = Queue()

    # Create and start the producer and consumer processes
    producer_thread = Thread(target=producer, args=(queue,))
    consumer_thread = Thread(target=consumer, args=(queue,))

    t1_start = perf_counter()

    producer_thread.start()
    consumer_thread.start()

    producer_thread.join()
    consumer_thread.join()

    t1_stop = perf_counter()

    logger.info(
        f"Elapsed time during the whole program in seconds: {t1_stop - t1_start}"
    )


def producer(queue: Queue) -> None:
    n_total_publications = neo4j_service.use_neo4j(
        f"""
            MATCH (p:Publication)
            RETURN count(*)
            """)
    n_total_publications = n_total_publications[0]['count(*)']
    n_increments = 200
    n_sync_steps = math.ceil(n_total_publications / n_increments)

    for i in range(n_sync_steps):
        queue.put(
            get_data(
                properties_list=list(publication_properties_dict.values()),
                data_type="Publication",
                increment=n_increments,
                offset=i,
            )
        )

    # 100 ish entries
    # queue.put(
    #     get_data(
    #         properties_list=list(field_properties_dict.values()),
    #         data_type="FieldOfStudy",
    #     )
    # )

    # Done
    queue.put(None)


def consumer(queue: Queue) -> None:
    while True:
        try:
            result = queue.get()

            # check for stop
            if result is None:
                break

            process_data(result)

        except Empty:
            logger.info("Consumer: got nothing, waiting a while...")
            sleep(0.5)
            continue
        except Exception as e:
            logger.info(f"Consumer: An exception occurred: {str(e)}")
            continue

    logger.info("Consumer: Done all")


def get_data(
        properties_list: list[str],
        data_type: str,
        increment=200,
        offset=0,
) -> list[dict[str, object]]:
    t_start = perf_counter()

    properties_list_in_string = ",".join(properties_list)

    result = neo4j_service.use_neo4j(
        f"""
        MATCH (p:Publication)-[:PUBLISHED_AT]->(v:Venue)
        WITH p, v
        SKIP {increment * offset} 
        LIMIT {increment}
        MATCH (p)-[:HAS_FIELD_OF_STUDY]-(f:FieldOfStudy)
        RETURN {properties_list_in_string}
        """)

    t_stop = perf_counter()
    logger.info(
        f"Got {data_type} for offset {offset} with time : {t_stop - t_start}")
    return (data_type, offset, result)


def process_data(entry: tuple[str, int, list[dict[str, object]]]) -> None:
    data_type, offset, neo4j_entity_list = entry
    property_list = publication_properties_dict.items()

    t_start = perf_counter()

    # Transform data
    data_list: list[dict] = []
    for neo4j_entity in neo4j_entity_list:
        temp = {}
        for key, value in property_list:
            # logger.info(neo4j_entity["p.publicationDate"])
            temp[key] = neo4j_entity[value]
        data_list.append(temp)

    # Send data to weaviate
    with client.batch as batch:
        for list_entry in data_list:
            cur_vector: list[float] = list_entry.pop("embedding")

            batch.add_data_object(
                data_object=list_entry,
                class_name=data_type,
                vector=cur_vector,
                uuid=generate_uuid5(list_entry["neo4jID"]),
            )

    t_stop = perf_counter()
    logger.info(
        f"Transfered {data_type} for offset {offset} with time : {t_stop - t_start}"
    )


publication_properties_dict = {
    "neo4jID": "elementId(p)",
    "embedding": "p.embedding",
    # for reranker
    "title": "p.publicationTitle",
    "abstract": "p.publicationAbstract",
    "venue": "v.abbreviation",
    "venue_name":"v.name",
    "authors": "p.authorList",
    "year": "toInteger(apoc.temporal.format(p.publicationDate, 'yyyy'))",
    "n_citations": "p.numberOfCitations",
    "n_key_citations": "p.numberOfInfluentialCitations",
    "field_list": "COLLECT(distinct elementId(f))",
    "survey": "'Survey' in labels(p)",
    # for reranking by recency
    "publication_date": "toString(p.publicationDate)"
}



# Classes
publication_class = {
    "class": "Publication",
    "properties": [
        {
            "dataType": ["text"],
            "name": "neo4jID",
        },
        # For Reranker
        {
            "dataType": ["text"],
            "name": "title",
        },
        {
            "dataType": ["text"],
            "name": "abstract",
        },
        {
            "dataType": ["text"],
            "name": "venue",
        },
        {
            "dataType": ["text"],
            "name": "venue_name",
        },
        {
            "dataType": ["text[]"],
            "name": "authors",
        },
        {
            "dataType": ["int"],
            "name": "year",
        },
        {
            "dataType": ["int"],
            "name": "n_citations",
        },
        {
            "dataType": ["int"],
            "name": "n_key_citations",
        },
        {
            "dataType": ["text[]"],
            "name": "field_list",
        },
        # For reranking by recency
        {
            "dataType": ["text"],
            "name": "publication_date",
        },
    ],
}
