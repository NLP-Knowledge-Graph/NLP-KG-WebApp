import os
from dotenv import find_dotenv, load_dotenv

# Connect the path with your '.env' file name
load_dotenv(find_dotenv())

WEAVIATE_URI = os.getenv("WEAVIATE_URI")
NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USER = os.getenv("NEO4J_USER")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
NEO4J_DATABASE = os.getenv("NEO4J_DATABASE")
