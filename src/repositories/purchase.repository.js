import { BaseRepository } from './base.repository.js';
import { Purchase } from '../models/Purchase.js';

class PurchaseRepository extends BaseRepository {
  constructor() {
    super(Purchase);
  }
}

export const purchaseRepository = new PurchaseRepository();
