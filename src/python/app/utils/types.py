from typing import TypedDict

class Publication(TypedDict):
    neo4jID: str
    title: str
    abstract: str
    venue: str
    authors: tuple[str]
    year: int
    n_citations: int
    n_key_citations: int
    field_list: tuple[str]
    publication_date: str
