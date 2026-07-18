import type { AdminResourceType } from "@/const/resource";
import type { AdminTranslationInput, AdminTranslationItem } from "@/types/translation";

export interface ResourceParent {
  id: string;
  name: string;
  key: string;
  code: string;
  icon?: string | null;
}

export interface ResourceMenuItem {
  id: string;
  pid?: string | null;
  name: string;
  key: string;
  code: string;
  icon?: string | null;
  path?: string | null;
  type: AdminResourceType;
  description?: string | null;
  remark?: string | null;
  sequence?: number;
  is_deleted?: boolean;
  is_visible?: boolean;
  parent?: ResourceParent | null;
  created_at?: string;
  updated_at?: string;
  translations?: AdminTranslationItem[];
}

export interface ResourceMenusResponse {
  items: ResourceMenuItem[];
}

export interface ResourceCreateData {
  name?: string;
  key: string;
  code: string;
  path: string;
  icon: string;
  type: AdminResourceType;
  is_visible?: boolean;
  description?: string;
  remark?: string;
  pid?: string;
  translations?: AdminTranslationInput[];
}

export interface ResourceUpdateData {
  name?: string;
  key?: string;
  code?: string;
  path?: string;
  icon?: string;
  type?: AdminResourceType;
  is_visible?: boolean;
  description?: string;
  remark?: string;
  pid?: string;
  translations?: AdminTranslationInput[];
}

export interface ResourceChangeSequenceData {
  id: string;
  sequence: number;
  another_id: string;
  another_sequence: number;
}

export interface DeleteResourceData {
  reason?: string;
  permanent?: boolean;
}

export interface ResourceChangeParentData {
  pid: string;
}
