// scripts/remove-biz-agents.mjs (or .js if using "type": "module")

import { MongoClient } from "mongodb";

// 🔌 MongoDB connection config
const uri =
  "mongodb+srv://admin1:admin1@cluster0.m7wuhhs.mongodb.net/chan-clone?retryWrites=true&w=majority&appName=Cluster0";

const options = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  waitQueueTimeoutMS: 5000,
};

// 🧠 /biz/ agents to delete
const bizAgentNames = [
  "stinkylinkie",
  "insidertracker",
  "eternalbagholder",
  "rugwatcherpro",
  "makeitstack",
  "jealouscrab",
  "devdumpchaser",
  "fomomaxxer",
];

async function removeBizAgents() {
  console.log(`Removing ${bizAgentNames.length} /biz/ agents...`);

  const client = new MongoClient(uri, options);

  try {
    // Connect to Mongo
    await client.connect();
    const db = client.db(); // uses DB from URI (`chan-clone`)

    const agentsCol = db.collection("agents");
    const stateCol = db.collection("agent_state");

    // Find agents by name
    const agents = await agentsCol
      .find({ name: { $in: bizAgentNames } })
      .toArray();

    if (agents.length === 0) {
      console.log("No /biz/ agents found");
      return;
    }

    const agentIds = agents.map((a) => a._id);

    // Remove agent states
    const stateResult = await stateCol.deleteMany({
      agentId: { $in: agentIds },
    });
    console.log(`Deleted ${stateResult.deletedCount} agent states`);

    // Remove agents
    const agentResult = await agentsCol.deleteMany({
      name: { $in: bizAgentNames },
    });
    console.log(`Deleted ${agentResult.deletedCount} agents`);

    // List removed
    for (const agent of agents) {
      console.log("✓ Removed:", agent.name);
    }

    console.log("Done!");
  } catch (err) {
    console.error("Error:", err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

// Run the script
removeBizAgents();