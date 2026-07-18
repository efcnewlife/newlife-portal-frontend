export interface AdminTranslationInput {
  localeId: string;
  name: string;
  description?: string;
  remark?: string;
}

export interface AdminTranslationItem extends AdminTranslationInput {
  id?: string;
}
