import { Category, TransactionType } from '../types';

interface RuleMatch {
  categoryId?: string;
  subCategory?: string;
  confidence: number;
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const tokenize = (value: string) =>
  normalize(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

export const inferCategoryFromDescription = (
  description: string,
  categories: Category[],
  type: TransactionType
): RuleMatch => {
  if (!description || type === 'TRANSFER') return { confidence: 0 };

  const typedCategories = categories.filter((category) => category.type === type);
  if (typedCategories.length === 0) return { confidence: 0 };

  const descTokens = tokenize(description);
  if (descTokens.length === 0) return { confidence: 0 };

  let bestMatch: RuleMatch = { confidence: 0 };

  typedCategories.forEach((category) => {
    const categoryTokens = tokenize(category.name);
    const matchedCategoryTokens = categoryTokens.filter((token) => descTokens.includes(token));

    const categoryScore = categoryTokens.length
      ? matchedCategoryTokens.length / categoryTokens.length
      : 0;

    let subCategoryScore = 0;
    let matchedSubCategory: string | undefined;

    category.subcategories.forEach((sub) => {
      const subTokens = tokenize(sub);
      const matchedSubTokens = subTokens.filter((token) => descTokens.includes(token));
      const score = subTokens.length ? matchedSubTokens.length / subTokens.length : 0;
      if (score > subCategoryScore) {
        subCategoryScore = score;
        matchedSubCategory = sub;
      }
    });

    const combinedScore = Math.max(categoryScore, subCategoryScore * 0.9);
    if (combinedScore > bestMatch.confidence) {
      bestMatch = {
        categoryId: category.id,
        subCategory: subCategoryScore >= 0.7 ? matchedSubCategory : undefined,
        confidence: combinedScore,
      };
    }
  });

  return bestMatch.confidence >= 0.6 ? bestMatch : { confidence: 0 };
};

