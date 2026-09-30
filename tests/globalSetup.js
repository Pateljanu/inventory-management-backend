import { MongoMemoryReplSet } from 'mongodb-memory-server';

// One single-node replica set (transactions need a replica set) shared by all test files.
// Each file uses its own database name, so files can run in parallel without interfering.
export default async function setup({ provide }) {
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  provide('mongoUri', replSet.getUri());
  return async () => {
    await replSet.stop();
  };
}
