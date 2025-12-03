
import { Transaction } from '../types';

export const parseOFX = (ofxContent: string): Partial<Transaction>[] => {
  const transactions: Partial<Transaction>[] = [];
  
  // Regex simples para capturar blocos STMTTRN
  const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  
  // Regex para campos específicos dentro de STMTTRN
  const dateRegex = /<DTPOSTED>(.*)/;
  const amountRegex = /<TRNAMT>(.*)/;
  const memoRegex = /<MEMO>(.*)/;

  let match;
  while ((match = transactionRegex.exec(ofxContent)) !== null) {
    const block = match[1];
    
    const dateMatch = block.match(dateRegex);
    const amountMatch = block.match(amountRegex);
    const memoMatch = block.match(memoRegex);
    
    if (amountMatch && dateMatch) {
      const rawAmount = parseFloat(amountMatch[1]);
      const rawDate = dateMatch[1].trim(); // Formato YYYYMMDDHHMMSS...
      
      // Formatar Data: YYYYMMDD -> YYYY-MM-DD
      const date = `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}`;
      
      const type = rawAmount >= 0 ? 'INCOME' : 'EXPENSE';
      const amount = Math.abs(rawAmount);
      const description = memoMatch ? memoMatch[1].trim() : 'Transação OFX';

      transactions.push({
        description,
        amount,
        type,
        date,
        status: 'COMPLETED', // Transações importadas geralmente já ocorreram
      });
    }
  }

  return transactions;
};
