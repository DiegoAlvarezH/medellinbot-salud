import 'server-only';
import { cached } from '@/lib/server/cache';
import { snapshotFirst } from '@/lib/server/snapshots';
import {
  fetchOtcList,
  matchOtc,
  medicineStem,
  searchRegisteredProducts,
  searchRegulatedPrices,
  type MedicineSearch,
  type OtcEntry,
} from '@/lib/sources/medicines';

const DAY = 24 * 60 * 60 * 1000;

function getOtcList(): Promise<OtcEntry[]> {
  return cached('invima-otc', 7 * DAY, async () => (await snapshotFirst('invima-otc', 30 * DAY, () => fetchOtcList())).data);
}

/**
 * Looks a medicine up by brand or active ingredient: INVIMA registrations in force,
 * whether it is sold without prescription, and the regulated maximum price if any.
 * Returns null when the input does not contain a usable word.
 */
export async function searchMedicines(input: string): Promise<MedicineSearch | null> {
  const stem = medicineStem(input);
  if (!stem) return null;
  return cached(`medicines:${stem}`, DAY, async () => {
    const [products, prices, otc] = await Promise.all([
      searchRegisteredProducts(stem),
      searchRegulatedPrices(stem).catch(() => []),
      getOtcList()
        .then((list) => matchOtc(stem, list))
        .catch(() => []),
    ]);
    return { query: stem, products, prices, otc };
  });
}
