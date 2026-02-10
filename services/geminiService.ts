import { AppData } from '../types';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const getMonthlyRate = (annualRate: number) => Math.pow(1 + annualRate / 100, 1 / 12) - 1;

const financingSummary = (query: string) => {
  const normalized = query.toLowerCase().replace(/,/g, '.');
  const valueMatch = normalized.match(/(valor|principal)\s*[:=]?\s*(\d+(?:\.\d+)?)/);
  const rateMatch = normalized.match(/(juros|taxa)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%?\s*(am|a\.m|aa|a\.a)?/);
  const monthsMatch = normalized.match(/(prazo|parcelas|meses)\s*[:=]?\s*(\d+)/);

  if (!valueMatch || !rateMatch || !monthsMatch) return null;

  const principal = parseFloat(valueMatch[2]);
  const rawRate = parseFloat(rateMatch[2]);
  const period = (rateMatch[3] || 'am').replace('.', '');
  const months = parseInt(monthsMatch[2], 10);
  const monthlyRate = period.includes('aa') ? getMonthlyRate(rawRate) : rawRate / 100;

  const pmt = monthlyRate === 0
    ? principal / months
    : principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  const totalPaid = pmt * months;
  const totalInterest = totalPaid - principal;

  const pros = [
    'Permite antecipar aquisição sem comprometer caixa imediato.',
    'Parcelas previsíveis para planejamento mensal.',
  ];
  const cons = [
    `Custo financeiro total de ${fmt(totalInterest)} em juros.`,
    'Risco de comprometer fluxo de caixa com parcelas longas.',
  ];

  return [
    '🏦 **Resumo de Financiamento (offline)**',
    `• Valor financiado: **${fmt(principal)}**`,
    `• Prazo: **${months} meses**`,
    `• Juros mensal equivalente: **${(monthlyRate * 100).toFixed(2)}%**`,
    `• Parcela estimada (PRICE): **${fmt(pmt)}**`,
    `• Total pago: **${fmt(totalPaid)}**`,
    `• Juros totais: **${fmt(totalInterest)}**`,
    '',
    '✅ **Prós**',
    ...pros.map(p => `- ${p}`),
    '',
    '⚠️ **Contras**',
    ...cons.map(c => `- ${c}`),
    '',
    '💡 Dica: compare com cenário de amortização antecipada para reduzir juros totais.'
  ].join('\n');
};

export const getFinancialAdvice = async (
  query: string,
  data: AppData
): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 350));

  const maybeFinancing = financingSummary(query);
  if (maybeFinancing) return maybeFinancing;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const transactions = data.transactions;
  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00');
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const income = currentMonthTransactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
  const expense = currentMonthTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;

  const categoryTotals: Record<string, number> = {};
  currentMonthTransactions.filter(t => t.type === 'EXPENSE' && t.categoryId).forEach(t => {
    if (t.categoryId) categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
  });

  let topCategoryName = 'Nenhuma';
  let topCategoryAmount = 0;
  Object.entries(categoryTotals).forEach(([catId, amount]) => {
    if (amount > topCategoryAmount) {
      topCategoryAmount = amount;
      const cat = data.categories.find(c => c.id === catId);
      if (cat) topCategoryName = cat.name;
    }
  });

  const pending = data.transactions.filter(t => t.status === 'PENDING' && t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const investPrincipal = (data.investments || []).reduce((s, i) => s + i.principal, 0);

  let analysis = `📊 **Análise Automática do Mês Atual:**\n\n`;
  analysis += `• Resumo: recebeu ${fmt(income)} e gastou ${fmt(expense)}.\n`;

  if (balance > 0) {
    analysis += `• ✅ Saldo positivo de ${fmt(balance)}.\n`;
    const savingsRate = income > 0 ? (balance / income) * 100 : 0;
    analysis += `• Taxa de poupança: ${savingsRate.toFixed(1)}%.\n`;
  } else if (balance < 0) {
    analysis += `• ⚠️ Saldo negativo de ${fmt(Math.abs(balance))}.\n`;
  } else {
    analysis += `• ⚖️ Resultado zerado no mês.\n`;
  }

  if (topCategoryAmount > 0) analysis += `\n🔍 Maior gasto: **${topCategoryName}** (${fmt(topCategoryAmount)}).\n`;
  analysis += `\n🧾 Pendências: ${fmt(pending)}.`;
  analysis += `\n🏦 Principal investido cadastrado: ${fmt(investPrincipal)}.`;

  analysis += '\n\n💡 Você também pode pedir: "valor 50000 juros 1.6 am prazo 48 meses" para análise de financiamento.';

  return analysis;
};
