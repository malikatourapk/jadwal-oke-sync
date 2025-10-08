import { StoreCategory } from './store';

export interface UnitConversion {
  unit: string;
  label: string;
  description: string;
}

export const UNIT_CONVERSIONS: Record<StoreCategory, UnitConversion[]> = {
  atk: [
    { unit: 'pcs', label: 'Pcs', description: '1 buah / potong' },
    { unit: 'lusin', label: 'Lusin', description: '12 pcs' },
    { unit: 'box', label: 'Box', description: '1 kotak' },
    { unit: 'pack', label: 'Pack', description: '1 bungkus' },
    { unit: 'rim', label: 'Rim', description: '500 lembar kertas' },
    { unit: 'lembar', label: 'Lembar', description: '1 helai' },
    { unit: 'set', label: 'Set', description: '1 paket' },
  ],
  sembako: [
    { unit: 'kg', label: 'Kg', description: '1000 gram' },
    { unit: 'ons', label: 'Ons', description: '100 gram' },
    { unit: 'gram', label: 'Gram', description: '1 satuan berat dasar' },
    { unit: 'liter', label: 'Liter', description: '1000 ml' },
    { unit: 'ml', label: 'ml', description: 'Mililiter' },
    { unit: 'bungkus', label: 'Bungkus', description: '1 kemasan kecil' },
    { unit: 'botol', label: 'Botol', description: '1 wadah cairan' },
    { unit: 'kaleng', label: 'Kaleng', description: '1 wadah logam' },
    { unit: 'sak', label: 'Sak', description: '1 karung besar (25-50 kg)' },
    { unit: 'dus', label: 'Dus', description: '1 karton besar' },
  ],
  pakaian: [
    { unit: 'pcs', label: 'Pcs', description: '1 helai / potong pakaian' },
    { unit: 'lusin', label: 'Lusin', description: '12 pcs' },
    { unit: 'set', label: 'Set', description: '1 paket (atasan + bawahan, dll)' },
    { unit: 'box', label: 'Box', description: '1 kotak' },
    { unit: 'pasang', label: 'Pasang', description: '2 buah (misal: sepatu, anting)' },
    { unit: 'meter', label: 'Meter', description: '1 meter panjang kain' },
    { unit: 'roll', label: 'Roll', description: '1 gulungan kain' },
  ],
  daging_ikan_sayur: [
    { unit: 'kg', label: 'Kg', description: '1000 gram' },
    { unit: 'ons', label: 'Ons', description: '100 gram' },
    { unit: 'gram', label: 'Gram', description: '1 satuan berat' },
    { unit: 'ekor', label: 'Ekor', description: '1 hewan utuh' },
    { unit: 'potong', label: 'Potong', description: '1 bagian dari hewan / sayur' },
    { unit: 'ikat', label: 'Ikat', description: '1 bundel (misal sayur bayam)' },
    { unit: 'bungkus', label: 'Bungkus', description: '1 kemasan' },
    { unit: 'box', label: 'Box', description: '1 kotak berisi beberapa potong' },
  ],
  kue_bahan_kue: [
    { unit: 'pcs', label: 'Pcs', description: '1 buah kue' },
    { unit: 'lembar', label: 'Lembar', description: '1 helai (misal roti lapis)' },
    { unit: 'bungkus', label: 'Bungkus', description: '1 kemasan' },
    { unit: 'pack', label: 'Pack', description: '1 bungkus berisi beberapa pcs' },
    { unit: 'kg', label: 'Kg', description: '1000 gram' },
    { unit: 'gram', label: 'Gram', description: '1 satuan berat' },
    { unit: 'liter', label: 'Liter', description: '1000 ml' },
    { unit: 'ml', label: 'ml', description: 'Mililiter' },
    { unit: 'loyang', label: 'Loyang', description: '1 wadah panggang kue' },
  ],
  bangunan: [
    { unit: 'pcs', label: 'Pcs', description: '1 buah barang' },
    { unit: 'sak', label: 'Sak', description: '1 karung (40-50 kg semen)' },
    { unit: 'kg', label: 'Kg', description: '1000 gram' },
    { unit: 'meter', label: 'Meter', description: '1 meter panjang bahan' },
    { unit: 'liter', label: 'Liter', description: '1000 ml' },
    { unit: 'dus', label: 'Dus', description: '1 karton berisi beberapa pcs' },
    { unit: 'lembar', label: 'Lembar', description: '1 lembar (triplek, seng)' },
    { unit: 'set', label: 'Set', description: '1 paket peralatan' },
  ],
  farmasi: [
    { unit: 'strip', label: 'Strip', description: '1 lembar berisi 10 tablet' },
    { unit: 'tablet', label: 'Tablet', description: '1 butir obat' },
    { unit: 'kaplet', label: 'Kaplet', description: '1 butir obat oval' },
    { unit: 'botol', label: 'Botol', description: '1 wadah cairan / sirup' },
    { unit: 'tube', label: 'Tube', description: '1 wadah salep' },
    { unit: 'box', label: 'Box', description: '1 kotak berisi beberapa strip' },
    { unit: 'ml', label: 'ml', description: 'Mililiter cairan obat' },
    { unit: 'pack', label: 'Pack', description: '1 bungkus' },
  ],
  sparepart_motor: [
    { unit: 'pcs', label: 'Pcs', description: '1 buah' },
    { unit: 'set', label: 'Set', description: '1 paket (misal: set kampas rem)' },
    { unit: 'liter', label: 'Liter', description: '1000 ml (misal: oli)' },
    { unit: 'box', label: 'Box', description: '1 kotak berisi beberapa pcs' },
    { unit: 'roll', label: 'Roll', description: '1 gulungan kabel / selang' },
    { unit: 'botol', label: 'Botol', description: '1 wadah cairan' },
  ],
  elektronik: [
    { unit: 'unit', label: 'Unit', description: '1 perangkat (TV, HP)' },
    { unit: 'set', label: 'Set', description: '1 paket lengkap (speaker + kabel)' },
    { unit: 'pcs', label: 'Pcs', description: '1 komponen' },
    { unit: 'box', label: 'Box', description: '1 kemasan besar' },
    { unit: 'meter', label: 'Meter', description: '1 meter kabel / antena' },
  ],
  pertanian_peternakan: [
    { unit: 'kg', label: 'Kg', description: '1000 gram' },
    { unit: 'sak', label: 'Sak', description: '1 karung (25-50 kg)' },
    { unit: 'liter', label: 'Liter', description: '1000 ml' },
    { unit: 'botol', label: 'Botol', description: '1 wadah cairan' },
    { unit: 'bungkus', label: 'Bungkus', description: '1 kemasan kecil' },
    { unit: 'pack', label: 'Pack', description: '1 bungkus sedang' },
    { unit: 'dus', label: 'Dus', description: '1 karton besar' },
  ],
  agen_sosis: [
    { unit: 'kg', label: 'Kg', description: '1000 gram' },
    { unit: 'ons', label: 'Ons', description: '100 gram' },
    { unit: 'gram', label: 'Gram', description: '1 satuan berat' },
    { unit: 'pcs', label: 'Pcs', description: '1 buah' },
    { unit: 'pack', label: 'Pack', description: '1 bungkus' },
    { unit: 'box', label: 'Box', description: '1 kotak' },
    { unit: 'karton', label: 'Karton', description: '1 kardus besar' },
  ],
  lainnya: [
    { unit: 'pcs', label: 'Pcs', description: '1 buah' },
    { unit: 'pack', label: 'Pack', description: '1 bungkus' },
    { unit: 'box', label: 'Box', description: '1 kotak' },
    { unit: 'kg', label: 'Kg', description: '1000 gram' },
    { unit: 'liter', label: 'Liter', description: '1000 ml' },
    { unit: 'unit', label: 'Unit', description: '1 unit' },
  ],
};

export const getUnitsForStoreCategory = (category: StoreCategory): UnitConversion[] => {
  return UNIT_CONVERSIONS[category] || UNIT_CONVERSIONS.atk;
};

export const getUnitLabel = (unit: string, category: StoreCategory): string => {
  const units = getUnitsForStoreCategory(category);
  const unitConversion = units.find(u => u.unit === unit);
  return unitConversion?.label || unit;
};

export const getUnitDescription = (unit: string, category: StoreCategory): string => {
  const units = getUnitsForStoreCategory(category);
  const unitConversion = units.find(u => u.unit === unit);
  return unitConversion?.description || unit;
};
