import { beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { useTestDatabase } from '../helpers/db.js';
import { runMigrations, migrationStatus } from '../../src/db/migrator.js';
import { Migration } from '../../src/models/Migration.js';
import { Company, Material, Purchase, SalesPO, Sale, User, RefreshSession } from '../../src/models/index.js';
import { materialRepository } from '../../src/repositories/material.repository.js';
import { d128, D } from '../../src/utils/decimal.js';

const clearDatabase = useTestDatabase();
const oid = () => new mongoose.Types.ObjectId();

async function indexesOf(model) {
  return model.collection.indexes();
}

describe('migrations', () => {
  it('are recorded and never re-applied', async () => {
    const status = await migrationStatus();
    expect(status.every((m) => m.appliedAt)).toBe(true);
    expect(await runMigrations()).toEqual([]);
  });

  it('refuse to run while another run holds the lock', async () => {
    await Migration.create({ _id: '__lock__', appliedAt: new Date() });
    await expect(runMigrations()).rejects.toThrow(/lock/);
    await Migration.deleteOne({ _id: '__lock__' });
  });

  it('create every documented index', async () => {
    const byName = async (model) => Object.fromEntries((await indexesOf(model)).map((i) => [JSON.stringify(i.key), i]));

    const company = await byName(Company);
    expect(company['{"normalizedName":1}'].unique).toBe(true);
    expect(company['{"gstNumber":1}'].partialFilterExpression).toBeTruthy();

    const material = await byName(Material);
    expect(material['{"normalizedName":1}'].unique).toBe(true);

    const purchase = await byName(Purchase);
    expect(purchase['{"companyId":1,"normalizedInvoiceNumber":1}'].unique).toBe(true);
    expect(purchase['{"materialId":1,"purchaseDate":-1}']).toBeTruthy();
    expect(purchase['{"companyId":1,"materialId":1,"purchaseDate":-1}']).toBeTruthy();

    const po = await byName(SalesPO);
    expect(po['{"companyId":1,"normalizedPoNumber":1}'].unique).toBe(true);

    const sale = await byName(Sale);
    expect(sale['{"poId":1,"saleDate":-1}']).toBeTruthy();
    expect(sale['{"sourceCompanyId":1,"materialId":1,"saleDate":-1}']).toBeTruthy();
    expect(sale['{"companyId":1,"normalizedChallanNumber":1}'].unique).toBe(true);

    const user = await byName(User);
    expect(user['{"email":1}'].unique).toBe(true);

    const session = await byName(RefreshSession);
    expect(session['{"tokenHash":1}'].unique).toBe(true);
    expect(session['{"expiresAt":1}'].expireAfterSeconds).toBe(0);
  });
});

describe('database constraints', () => {
  beforeEach(clearDatabase);

  const purchaseDoc = (overrides = {}) => ({
    purchaseDate: new Date('2026-09-20'),
    companyId: oid(),
    materialId: oid(),
    quantityTons: d128('10', 3),
    ratePerTon: d128('100', 2),
    totalAmount: d128('1000', 2),
    createdBy: oid(),
    ...overrides
  });

  const poDoc = (overrides = {}) => ({
    poNumber: 'PO-1',
    normalizedPoNumber: 'PO-1',
    poDate: new Date('2026-09-20'),
    companyId: oid(),
    materialId: oid(),
    quantityTons: d128('10', 3),
    ratePerTon: d128('100', 2),
    totalPOAmount: d128('1000', 2),
    createdBy: oid(),
    ...overrides
  });

  it('rejects duplicate normalized company and material names', async () => {
    await Company.create({ name: 'Akshat TMT', normalizedName: 'akshat tmt', type: 'PURCHASE' });
    await expect(
      Company.create({ name: 'AKSHAT TMT', normalizedName: 'akshat tmt', type: 'SALE' })
    ).rejects.toMatchObject({ code: 11000 });

    await Material.create({ name: 'MS Scrap', normalizedName: 'ms scrap' });
    await expect(Material.create({ name: 'ms scrap', normalizedName: 'ms scrap' })).rejects.toMatchObject({
      code: 11000
    });
  });

  it('allows many companies without GST but not duplicate GST numbers', async () => {
    await Company.create({ name: 'A', normalizedName: 'a', type: 'SALE' });
    await Company.create({ name: 'B', normalizedName: 'b', type: 'SALE' });
    await Company.create({ name: 'C', normalizedName: 'c', type: 'SALE', gstNumber: '24AAAAA0000A1Z5' });
    await expect(
      Company.create({ name: 'D', normalizedName: 'd', type: 'SALE', gstNumber: '24AAAAA0000A1Z5' })
    ).rejects.toMatchObject({
      code: 11000
    });
  });

  it('enforces Company + invoice uniqueness only when an invoice number is present', async () => {
    const companyId = oid();
    await Purchase.create(purchaseDoc({ companyId }));
    await Purchase.create(purchaseDoc({ companyId })); // no invoice twice: allowed
    await Purchase.create(purchaseDoc({ companyId, invoiceNumber: 'INV-1', normalizedInvoiceNumber: 'INV-1' }));
    await Purchase.create(purchaseDoc({ invoiceNumber: 'INV-1', normalizedInvoiceNumber: 'INV-1' })); // other company: allowed
    await expect(
      Purchase.create(purchaseDoc({ companyId, invoiceNumber: 'inv-1', normalizedInvoiceNumber: 'INV-1' }))
    ).rejects.toMatchObject({ code: 11000 });
  });

  it('enforces PO number uniqueness per customer company', async () => {
    const companyId = oid();
    await SalesPO.create(poDoc({ companyId }));
    await SalesPO.create(poDoc()); // same PO number, different customer: allowed
    await expect(SalesPO.create(poDoc({ companyId }))).rejects.toMatchObject({ code: 11000 });
  });

  it('enforces Company + challan uniqueness only when a challan is present', async () => {
    const companyId = oid();
    const sale = (overrides = {}) => ({
      saleDate: new Date('2026-09-21'),
      poId: oid(),
      companyId,
      sourceCompanyId: oid(),
      materialId: oid(),
      quantityTons: d128('1', 3),
      poRateAtSale: d128('100', 2),
      totalAmount: d128('100', 2),
      createdBy: oid(),
      ...overrides
    });
    await Sale.create(sale());
    await Sale.create(sale());
    await Sale.create(sale({ challanNumber: 'CH-1', normalizedChallanNumber: 'CH-1' }));
    await expect(Sale.create(sale({ challanNumber: 'CH-1', normalizedChallanNumber: 'CH-1' }))).rejects.toMatchObject({
      code: 11000
    });
  });

  it('persists and aggregates decimals exactly', async () => {
    const materialId = oid();
    for (const q of ['0.100', '0.200', '30.250']) {
      await Purchase.create(purchaseDoc({ materialId, quantityTons: d128(q, 3) }));
    }
    const stored = await Purchase.findOne({ materialId }).lean();
    expect(stored.quantityTons.toString()).toBe('0.100');
    const [row] = await Purchase.aggregate([
      { $match: { materialId } },
      { $group: { _id: null, total: { $sum: '$quantityTons' } } }
    ]);
    expect(D(row.total).toFixed(3)).toBe('30.550');
  });

  it('never returns password hashes unless explicitly selected', async () => {
    await User.create({ email: 'owner@example.com', passwordHash: 'hash' });
    expect((await User.findOne().lean()).passwordHash).toBeUndefined();
    expect((await User.findOne().select('+passwordHash').lean()).passwordHash).toBe('hash');
  });

  it('rolls back every write in an aborted transaction', async () => {
    const session = await mongoose.startSession();
    await expect(
      session.withTransaction(async () => {
        await Material.create([{ name: 'Temp', normalizedName: 'temp' }], { session });
        throw new Error('business rule failed');
      })
    ).rejects.toThrow('business rule failed');
    await session.endSession();
    expect(await Material.countDocuments()).toBe(0);
  });

  it('serializes concurrent transactions that lock the same material', async () => {
    const material = await Material.create({ name: 'Locked', normalizedName: 'locked' });
    const log = [];
    const run = async (label) => {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          await materialRepository.lock(material._id, { session });
          log.push(`${label}:locked`);
          await new Promise((r) => setTimeout(r, 150));
          log.push(`${label}:done`);
        });
      } finally {
        await session.endSession();
      }
    };
    await Promise.all([run('A'), run('B')]);
    const final = await Material.findById(material._id).select('+lockVersion').lean();
    // Both committed exactly once; the loser of the write conflict was retried.
    expect(final.lockVersion).toBe(2);
    expect(log.filter((l) => l.endsWith(':locked')).length).toBeGreaterThanOrEqual(2);
  });
});
