import { Transaction } from '../types';
import { parseOFX } from './ofxParser';
import { StagingItem } from './indexedDbService';

const normalize = (v: string) => (v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const makeFingerprint = (tx: Pick<Transaction, 'date' | 'amount' | 'description' | 'accountId'>) =>
  `${tx.accountId}|${tx.date}|${Math.abs(Math.round(tx.amount * 100))}|${normalize(tx.description)}`;

export const buildOFXStagingItems = (
  ofxString: string,
  accountId: string,
  existingTransactions: Transaction[]
): StagingItem[] => {
  const parsed = parseOFX(ofxString);
  const known = new Set(existingTransactions.map((t) => makeFingerprint(t)));
  const seenInBatch = new Set<string>();

  return parsed.map((item) => {
    const tx: Transaction = {
      id: crypto.randomUUID(),
      description: item.description || 'OFX',
      amount: item.amount || 0,
      type: item.type as any,
      status: 'COMPLETED',
      date: item.date || new Date().toISOString().split('T')[0],
      accountId,
    };

    const fp = makeFingerprint(tx);
    const possibleDuplicate = known.has(fp) || seenInBatch.has(fp);
    seenInBatch.add(fp);

    return {
      id: tx.id,
      transaction: tx,
      possibleDuplicate,
    };
  });
};
