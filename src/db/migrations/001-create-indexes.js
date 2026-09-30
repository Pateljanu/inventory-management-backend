import { Company, Material, Purchase, SalesPO, Sale, User, RefreshSession } from '../../models/index.js';

export const id = '001-create-indexes';
export const description = 'Create all collections and their unique, compound, partial and TTL indexes';

export async function up() {
  // Sequential on purpose: keeps index builds from competing for resources on a small cluster.
  for (const model of [Company, Material, Purchase, SalesPO, Sale, User, RefreshSession]) {
    await model.createCollection();
    await model.syncIndexes();
  }
}
