import { VoidedSale } from '../../models/index.js';

export const id = '002-voided-sales';
export const description = 'Create the voidedsales collection (voided deliveries) and its indexes';

export async function up() {
  await VoidedSale.createCollection();
  await VoidedSale.syncIndexes();
}
