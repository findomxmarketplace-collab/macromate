/**
 * Comprehensive allergen keyword mapping.
 * Each allergen maps to ingredient keywords that should be filtered.
 */

const allergenMap = {
  'Dairy': ['cheese', 'milk', 'cream', 'butter', 'yogurt', 'parmesan', 'mozzarella', 'cheddar', 'ricotta', 'feta', 'gouda', 'swiss', 'cottage cheese', 'cream cheese', 'sour cream', 'ghee', 'dairy', 'colby', 'provolone', 'havarti', 'camembert', 'brie', 'manchego', 'asiago', 'pecorino', 'queso', 'fromage'],
  'Nuts': ['almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'hazelnut', 'macadamia', 'nut', 'pine nut', 'marzipan', 'praline'],
  'Peanuts': ['peanut', 'peanut butter', 'ground nut', 'monkey nut'],
  'Shellfish': ['shrimp', 'prawn', 'crab', 'lobster', 'scallop', 'mussel', 'clam', 'oyster', 'crayfish', 'langoustine'],
  'Eggs': ['egg', 'eggs', 'egg white', 'egg yolk', 'mayonnaise', 'meringue', 'custard'],
  'Soy': ['soy', 'soya', 'tofu', 'edamame', 'tempeh', 'miso', 'soy sauce', 'tamari'],
  'Fish': ['salmon', 'tuna', 'cod', 'sardine', 'mackerel', 'trout', 'halibut', 'fish', 'tilapia', 'haddock', 'pollock', 'anchovy', 'sea bass', 'snapper', 'white fish'],
  'Gluten': ['wheat', 'bread', 'pasta', 'flour', 'tortilla', 'cracker', 'cereal', 'oats', 'barley', 'rye', 'couscous', 'bulgur', 'semolina', 'spelt', 'kamut', 'triticale', 'seitan', 'noodle'],
  'Sesame': ['sesame', 'tahini', 'sesame seed', 'sesame oil'],
}

export function getAllergenKeywords(allergens) {
  const keywords = []
  for (const a of allergens) {
    const map = allergenMap[a]
    if (map) keywords.push(...map)
  }
  return [...new Set(keywords)]
}

export const ALLERGEN_OPTIONS = Object.keys(allergenMap)

export default allergenMap