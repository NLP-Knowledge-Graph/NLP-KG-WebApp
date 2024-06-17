from neo4j import GraphDatabase, AsyncGraphDatabase
from ..utils.env import NEO4J_PASSWORD, NEO4J_URI, NEO4J_USER, NEO4J_DATABASE


def use_neo4j(query: str, param: dict = {}) -> list[dict[str, object]]:
    with GraphDatabase.driver(
        NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD), database=NEO4J_DATABASE
    ) as driver:
        records, _, _ = driver.execute_query(query, parameters_=param)
        return [dict(record.data()) for record in records]


async def use_neo4j_async(query: str, param: dict = {}) -> list[dict[str, object]]:
    with AsyncGraphDatabase.driver(
        NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD), database=NEO4J_DATABASE
    ) as driver:
        records, _, _ = await driver.execute_query(query, parameters_=param)
        return [dict(record.data()) for record in records]


def health_check_neo4j():
    with GraphDatabase.driver(
        NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD), database=NEO4J_DATABASE
    ) as driver:
        driver.verify_connectivity()
        return True
