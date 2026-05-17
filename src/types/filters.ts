export type ProductListFilter = 'all' | 'expired' | 'critical' | 'attention' | 'healthy';

export const productListFilterLabels: Record<ProductListFilter, string> = {
  all: 'Todos',
  expired: 'Vencidos',
  critical: 'Crítico',
  attention: 'Atenção',
  healthy: 'Saudável',
};
