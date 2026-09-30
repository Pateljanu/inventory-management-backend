import { beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { useTestDatabase } from '../helpers/db.js';
import { authedClient } from '../helpers/api.js';
import { Company } from '../../src/models/Company.js';
import { Material } from '../../src/models/Material.js';
import { Purchase } from '../../src/models/Purchase.js';
import { Sale } from '../../src/models/Sale.js';
import { SalesPO } from '../../src/models/SalesPO.js';
import { d128 } from '../../src/utils/decimal.js';

const clearDatabase = useTestDatabase();
let owner;

beforeEach(async () => {
  await clearDatabase();
  owner = await authedClient();
});

const oid = () => new mongoose.Types.ObjectId();

describe('companies', () => {
  it('creates a company with normalized name and GST', async () => {
    const res = await owner.post('/api/v1/companies', {
      name: '  Akshat   TMT  ',
      type: 'PURCHASE',
      gstNumber: '24aaaca 1234a1z5',
      contact: { person: 'Ravi', phone: '+91 98765 43210', email: 'Ravi@Akshat.com' }
    });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      name: 'Akshat TMT',
      normalizedName: 'akshat tmt',
      gstNumber: '24AAACA1234A1Z5',
      type: 'PURCHASE',
      isActive: true,
      contact: { person: 'Ravi', email: 'ravi@akshat.com' }
    });
    expect(res.body.data._id).toMatch(/^[a-f0-9]{24}$/);
  });

  it('rejects duplicate-looking names with DUPLICATE_VALUE', async () => {
    await owner.post('/api/v1/companies', { name: 'Akshat TMT', type: 'PURCHASE' });
    const res = await owner.post('/api/v1/companies', { name: 'AKSHAT  tmt', type: 'SALE' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({ code: 'DUPLICATE_VALUE', details: { fields: ['normalizedName'] } });
  });

  it('validates type and GST format', async () => {
    const res = await owner.post('/api/v1/companies', { name: 'X Co', type: 'VENDOR', gstNumber: '12345' });
    expect(res.status).toBe(422);
    const paths = res.body.error.details.issues.map((i) => i.path);
    expect(paths).toEqual(expect.arrayContaining(['body.type', 'body.gstNumber']));
  });

  it('filters by usage, active flag and search, with pagination meta', async () => {
    await Company.create([
      { name: 'Alpha Supplier', normalizedName: 'alpha supplier', type: 'PURCHASE' },
      { name: 'Beta Customer', normalizedName: 'beta customer', type: 'SALE' },
      { name: 'Gamma Both', normalizedName: 'gamma both', type: 'BOTH' },
      { name: 'Delta Old', normalizedName: 'delta old', type: 'PURCHASE', isActive: false }
    ]);

    const purchase = await owner.get('/api/v1/companies?usage=purchase&isActive=true');
    expect(purchase.body.data.map((c) => c.name)).toEqual(['Alpha Supplier', 'Gamma Both']);

    const sale = await owner.get('/api/v1/companies?usage=sale');
    expect(sale.body.data.map((c) => c.name)).toEqual(['Beta Customer', 'Gamma Both']);

    // Regression: "false" must mean false, not Boolean("false") === true.
    const inactive = await owner.get('/api/v1/companies?isActive=false');
    expect(inactive.body.data.map((c) => c.name)).toEqual(['Delta Old']);

    const search = await owner.get('/api/v1/companies?search=gam');
    expect(search.body.data.map((c) => c.name)).toEqual(['Gamma Both']);

    // Regex metacharacters are treated literally.
    expect((await owner.get('/api/v1/companies?search=.*')).body.data).toEqual([]);

    const paged = await owner.get('/api/v1/companies?limit=2&page=2');
    expect(paged.body.meta).toEqual({ page: 2, limit: 2, total: 4, totalPages: 2 });
    expect(paged.body.data).toHaveLength(2);
  });

  it('gets by id and distinguishes malformed from missing ids', async () => {
    const created = await owner.post('/api/v1/companies', { name: 'Readable Co', type: 'SALE' });
    expect((await owner.get(`/api/v1/companies/${created.body.data._id}`)).body.data.name).toBe('Readable Co');
    expect((await owner.get('/api/v1/companies/not-an-id')).status).toBe(422);
    const missing = await owner.get(`/api/v1/companies/${oid()}`);
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('COMPANY_NOT_FOUND');
  });

  it('patches fields, clears GST with an empty string, and rejects empty patches', async () => {
    const created = await owner.post('/api/v1/companies', {
      name: 'Patch Co',
      type: 'SALE',
      gstNumber: '24AAACA1234A1Z5'
    });
    const id = created.body.data._id;

    const res = await owner.patch(`/api/v1/companies/${id}`, {
      gstNumber: '',
      address: ' Plot 4,  GIDC ',
      isActive: false
    });
    expect(res.status).toBe(200);
    expect(res.body.data.gstNumber).toBeUndefined();
    expect(res.body.data).toMatchObject({ address: 'Plot 4, GIDC', isActive: false });

    expect((await owner.patch(`/api/v1/companies/${id}`, {})).status).toBe(422);
  });

  it('blocks type changes that would orphan purchase or PO history', async () => {
    const supplier = await Company.create({ name: 'Supplier', normalizedName: 'supplier', type: 'PURCHASE' });
    await Purchase.create({
      purchaseDate: new Date('2026-09-01'),
      companyId: supplier._id,
      materialId: oid(),
      quantityTons: d128('1'),
      ratePerTon: d128('1', 2),
      totalAmount: d128('1', 2),
      createdBy: owner.user._id
    });
    const toSale = await owner.patch(`/api/v1/companies/${supplier._id}`, { type: 'SALE' });
    expect(toSale.status).toBe(409);
    expect(toSale.body.error.code).toBe('COMPANY_TYPE_IN_USE');
    expect((await owner.patch(`/api/v1/companies/${supplier._id}`, { type: 'BOTH' })).status).toBe(200);

    const customer = await Company.create({ name: 'Customer', normalizedName: 'customer', type: 'SALE' });
    await SalesPO.create({
      poNumber: 'PO-1',
      normalizedPoNumber: 'PO-1',
      poDate: new Date('2026-09-01'),
      companyId: customer._id,
      materialId: oid(),
      quantityTons: d128('1'),
      ratePerTon: d128('1', 2),
      totalPOAmount: d128('1', 2),
      createdBy: owner.user._id
    });
    expect((await owner.patch(`/api/v1/companies/${customer._id}`, { type: 'PURCHASE' })).status).toBe(409);
  });
});

describe('materials', () => {
  it('creates a material with exact decimal opening stock', async () => {
    const res = await owner.post('/api/v1/materials', {
      name: ' MS Scrap  Fish Cut ',
      openingStockTons: '25.5',
      notes: 'Primary grade'
    });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      name: 'MS Scrap Fish Cut',
      normalizedName: 'ms scrap fish cut',
      openingStockTons: '25.500'
    });
    expect(res.body.data.lockVersion).toBeUndefined();

    const fromNumber = await owner.post('/api/v1/materials', { name: 'HMS 1', openingStockTons: 0.1 });
    expect(fromNumber.body.data.openingStockTons).toBe('0.100');

    const noStock = await owner.post('/api/v1/materials', { name: 'Turnings' });
    expect(noStock.body.data.openingStockTons).toBe('0.000');
  });

  it('rejects too many decimals, negatives and duplicate names', async () => {
    expect((await owner.post('/api/v1/materials', { name: 'Bad A', openingStockTons: '1.2345' })).status).toBe(422);
    expect((await owner.post('/api/v1/materials', { name: 'Bad B', openingStockTons: '-1' })).status).toBe(422);
    expect((await owner.post('/api/v1/materials', { name: 'Bad C', openingStockTons: '1e3' })).status).toBe(422);
    await owner.post('/api/v1/materials', { name: 'Copper Wire' });
    expect((await owner.post('/api/v1/materials', { name: 'copper  WIRE' })).status).toBe(409);
  });

  it('returns current stock on the detail endpoint', async () => {
    const material = await Material.create({ name: 'Brass', normalizedName: 'brass', openingStockTons: d128('10') });
    await Purchase.create({
      purchaseDate: new Date('2026-01-01'),
      companyId: oid(),
      materialId: material._id,
      quantityTons: d128('2.5'),
      ratePerTon: d128('1', 2),
      totalAmount: d128('2.5', 2),
      createdBy: owner.user._id
    });
    const res = await owner.get(`/api/v1/materials/${material._id}`);
    expect(res.body.data.currentStockTons).toBe('12.500');
  });

  it('rejects an opening-stock reduction that would make past stock negative, and changes nothing', async () => {
    const material = await Material.create({
      name: 'Aluminium',
      normalizedName: 'aluminium',
      openingStockTons: d128('10')
    });
    // Day 1: sell 8 from opening stock. Day 2: buy 20. Opening stock must stay >= 8.
    await Sale.create({
      saleDate: new Date('2026-09-01'),
      poId: oid(),
      companyId: oid(),
      sourceCompanyId: oid(),
      materialId: material._id,
      quantityTons: d128('8'),
      poRateAtSale: d128('1', 2),
      totalAmount: d128('8', 2),
      createdBy: owner.user._id
    });
    await Purchase.create({
      purchaseDate: new Date('2026-09-02'),
      companyId: oid(),
      materialId: material._id,
      quantityTons: d128('20'),
      ratePerTon: d128('1', 2),
      totalAmount: d128('20', 2),
      createdBy: owner.user._id
    });

    const res = await owner.patch(`/api/v1/materials/${material._id}`, {
      openingStockTons: '5',
      name: 'Aluminium Renamed'
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      code: 'NEGATIVE_STOCK_HISTORY',
      details: { at: '2026-09-01T00:00:00.000Z', balanceTons: '-3.000' }
    });
    const unchanged = await Material.findById(material._id).lean();
    expect(unchanged.openingStockTons.toString()).toBe('10.000');
    expect(unchanged.name).toBe('Aluminium');

    const ok = await owner.patch(`/api/v1/materials/${material._id}`, { openingStockTons: '8' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.openingStockTons).toBe('8.000');
  });

  it('filters by active flag and search', async () => {
    await Material.create([
      { name: 'Copper', normalizedName: 'copper' },
      { name: 'Old Grade', normalizedName: 'old grade', isActive: false }
    ]);
    expect((await owner.get('/api/v1/materials?isActive=true')).body.data.map((m) => m.name)).toEqual(['Copper']);
    expect((await owner.get('/api/v1/materials?search=old')).body.data.map((m) => m.name)).toEqual(['Old Grade']);
  });
});
