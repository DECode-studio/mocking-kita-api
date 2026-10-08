export const FAQ_SEMANTIC_ID = {
  CONTAINER: 'faq-container-root',
  SEARCH_INPUT: 'faq-search-input-field',
  CATEGORY_LIST: 'faq-category-selection-list',
  CATEGORY_BTN: (category: string) => `faq-category-btn-${category.toLowerCase().replace(/\s+/g, '-')}`,
  ACCORDION_LIST: 'faq-accordion-items-list',
  ACCORDION_ITEM: (id: string) => `faq-accordion-item-${id}`,
  ACCORDION_TOGGLE: (id: string) => `faq-accordion-toggle-${id}`,
} as const;
