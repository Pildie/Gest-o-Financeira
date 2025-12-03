
import { AppData } from "../types";

/**
 * SERVIÇO DE ANÁLISE LOCAL (OFFLINE)
 * Substitui a antiga conexão com API de IA.
 * Agora toda a análise é feita matematicamente no dispositivo do usuário.
 */

export const getFinancialAdvice = async (
  _query: string,
  data: AppData
): Promise<string> => {
  // Simula um pequeno delay para parecer que está "processando"
  await new Promise(resolve => setTimeout(resolve, 800));

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filtros Básicos
  const transactions = data.transactions;
  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00');
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Cálculos
  const income = currentMonthTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amount, 0);

  const expense = currentMonthTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = income - expense;

  // Análise por Categoria
  const categoryTotals: Record<string, number> = {};
  currentMonthTransactions
    .filter(t => t.type === 'EXPENSE' && t.categoryId)
    .forEach(t => {
      if (t.categoryId) {
        categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
      }
    });

  let topCategoryName = "Nenhuma";
  let topCategoryAmount = 0;

  Object.entries(categoryTotals).forEach(([catId, amount]) => {
    if (amount > topCategoryAmount) {
      topCategoryAmount = amount;
      const cat = data.categories.find(c => c.id === catId);
      if (cat) topCategoryName = cat.name;
    }
  });

  // Formatação de Moeda
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // Construção da Resposta baseada em regras (Rule-based AI)
  let analysis = `📊 **Análise Automática do Mês Atual:**\n\n`;
  
  analysis += `• **Resumo:** Você recebeu ${fmt(income)} e gastou ${fmt(expense)}.\n`;
  
  if (balance > 0) {
    analysis += `• ✅ **Saldo Positivo:** Parabéns! Você está economizando ${fmt(balance)} este mês.\n`;
    const savingsRate = income > 0 ? (balance / income) * 100 : 0;
    analysis += `• 📈 **Taxa de Poupança:** Você guardou cerca de ${savingsRate.toFixed(1)}% da sua renda.\n`;
  } else if (balance < 0) {
    analysis += `• ⚠️ **Alerta:** Seus gastos superaram seus ganhos em ${fmt(Math.abs(balance))}. Cuidado com o endividamento.\n`;
  } else {
    analysis += `• ⚖️ **Equilíbrio:** Você gastou exatamente o que ganhou.\n`;
  }

  if (topCategoryAmount > 0) {
    analysis += `\n🔍 **Maior Gasto:** Sua principal despesa é **${topCategoryName}** com ${fmt(topCategoryAmount)}.\n`;
  }

  // Dicas Genéricas baseadas no saldo
  analysis += `\n💡 **Dica do Sistema:** `;
  if (expense > income) {
    analysis += "Revise suas despesas fixas e corte gastos supérfluos na categoria " + topCategoryName + ".";
  } else if (balance > 0 && balance < 500) {
    analysis += "Tente aumentar sua reserva de emergência transferindo esse saldo para a Poupança.";
  } else if (balance === 0) {
    analysis += "Tente reduzir pelo menos 10% dos gastos com lazer para começar a sobrar dinheiro.";
  } else {
    analysis += "Excelente gestão financeira! Considere investir o excedente em objetivos de longo prazo.";
  }

  return analysis;
};
