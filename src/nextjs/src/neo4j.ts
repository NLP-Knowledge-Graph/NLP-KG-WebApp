import neo4j, { Driver } from "neo4j-driver";
import { env } from "~/env.cjs";

const globalForNeo4j = globalThis as unknown as {
  neo4j: Driver | undefined;
};

export const neo4jDriver =
  globalForNeo4j.neo4j ??
  neo4j.driver(
    env.DATABASE_URI,
    neo4j.auth.basic(env.DATABASE_USERNAME, env.DATABASE_PASSWORD),
    { disableLosslessIntegers: true }
  );

if (env.NODE_ENV !== "production") globalForNeo4j.neo4j = neo4jDriver;
