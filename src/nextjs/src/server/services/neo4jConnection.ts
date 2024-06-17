import { neo4jDriver } from "~/neo4j";

export const read = async (cypher: string, params = {}) => {
  // 1. Open a session
  const session = neo4jDriver.session();

  try {
    // 2. Execute a Cypher Statement
    const res = await session.executeRead((tx) => tx.run(cypher, params));

    // 3. Process the Results
    const values = res.records.map((record) => {
      return record.toObject();
    });

    return values;
  } finally {
    // 4. Close the session
    await session.close();
  }
};
