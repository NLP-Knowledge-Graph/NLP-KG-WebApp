# NLP-KG

Repository for the NLP-KG web application.

# Setup

- Add .env files in both `/python` and `/nextjs`. Use the `.env.example` files for reference.

## Setup Python

- Download the [S2Ranker](https://github.com/allenai/s2search) model using the following instruction, install awscli if applicable.

```
aws s3 cp --no-sign-request s3://ai2-s2-research-public/s2search_data.zip .
```

- If command throws `Could not connect to the endpoint URL` try adding `--region eu-central-1` flag

- unzip the contents to PROJECT/python/data/s2search/

```
sudo unzip s2search_data.zip -d PROJECT/python/data/
```

- Make sure you have git lfs installed

```
git install lfs
```

- `cd` into the project folder and download the [SPECTER2](https://huggingface.co/allenai/specter2_base) model and adapters

```
git clone https://huggingface.co/allenai/specter2_base python/data/encoder_data
git clone https://huggingface.co/allenai/specter2_adhoc_query python/data/model_adapter_data
```

## Setup Next.js

- The callback url for all the following authentication options should be in the form of `http://<domain or localhost:3000>/api/auth/callback/<github,google,linkedin, or gitlab>`. Be aware that IP Addresses might not work for some providers.
- Create your own GitHub Application: https://github.com/settings/apps and use the Client ID as `GITHUB_ID` and create a new App secret and use it as `GITHUB_SECRET` in your `nextjs/.env` (see https://next-auth.js.org/providers/github for reference)
- You can additionally add Google, Gitlab or LinkedIn other providers:
  - https://next-auth.js.org/providers/google
  - https://next-auth.js.org/providers/gitlab
  - https://next-auth.js.org/providers/linkedin
- Create a NEXTAUTH_SECRET as described [here](https://next-auth.js.org/configuration/options) and in
  the `nextjs/.env.example`

## Running the whole project

Make sure to have the latest versions of Docker (>=24.0.5) and docker-compose (>=2.24.6) installed

- `cd` into the project folder and run the application using the following commands

```
sudo docker-compose build
sudo docker-compose up
```

### Development mode

Run the web application in development mode:

- set `NODE_ENV=development` in `nextjs/.env`
- set `dockerfile: Dockerfile` in `docker-compose.yml`

### Production mode

Run the web application in production mode:

- set `NODE_ENV=production` in `nextjs/.env`
- set `dockerfile: Dockerfile.prod` in `docker-compose.yml`

# Architecture and Technologies

Next.js runs the web server which includes websockets for realtime communication and most functionalities regarding
searching, creating bookmarks, editing profiles, etc.
For that it mostly uses MongoDB.

Python is mainly used for querying Weaviate to rank search results. It exposes a FastAPI which gets called by the
Next.js Backend.

Both Containers access the Neo4j Database for publication data.

## Next.js

The App is bootstrapped with [`create-t3-app`](https://create.t3.gg/) and exist within /nextjs

Techologies used

- [Next.js](https://nextjs.org) for fullstack
- [tRPC](https://trpc.io) for application layer (API)
- [Next-auth](https://next-auth.js.org/) for authentication
- [Tailwind CSS](https://tailwindcss.com) for styling
- [DaisyUI](https://daisyui.com/) for styling
- [Neo4j](https://weaviate.io) and [MongoDB](https://www.mongodb.com) as Databases

## Python service

The Pyton service is used to recommend most relevant entities

Techologies used:

- [FastAPI](https://fastapi.tiangolo.com)
- [Hugging Face ](https://huggingface.co)Models for Tokenizing
- [KenLM](https://github.com/kpu/kenlm) for reranking of search results
- [Neo4j](https://neo4j.com) and [Weaviate](https://weaviate.io) for Databases and searching
