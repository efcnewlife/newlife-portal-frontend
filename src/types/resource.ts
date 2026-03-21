import { AdminResourceType } from "../const/resource";

// Resource menu item (maps to API response)
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
  is_group?: boolean; // Whether this is a group item
  group_type?: "MENU" | "SYSTEM"; // Group type
}

// Create resource request
export interface CreateResourceRequest {
  pid?: string;
  name: string;
  key: string;
  code: string;
  icon: string;
  path: string;
  type: AdminResourceType;
  is_visible?: boolean;
  description?: string;
  remark?: string;
}

// Update resource request
export interface UpdateResourceRequest {
  name?: string;
  key?: string;
  code?: string;
  icon?: string;
  path?: string;
  type?: AdminResourceType;
  is_visible?: boolean;
  description?: string;
  remark?: string;
}

// Delete resource request
export interface DeleteResourceRequest {
  reason?: string;
  permanent?: boolean;
}

// Change sequence request
export interface ChangeSequenceRequest {
  id: string;
  sequence: number;
  another_id: string;
  another_sequence: number;
}

// Tree node
export interface ResourceTreeNode {
  id: string;
  pid: string | null | undefined;
  name: string;
  key: string;
  code: string;
  icon?: string | null;
  path?: string | null;
  type: AdminResourceType;
  description?: string | null;
  remark?: string | null;
  sequence: number;
  is_deleted: boolean;
  children: ResourceTreeNode[];
  level: number;
  is_group?: boolean; // Whether this is a group item
  group_type?: "MENU" | "SYSTEM"; // Group type
}

// Resource form data
export interface ResourceFormData {
  name: string;
  key: string;
  code: string;
  icon: string;
  path: string;
  type: AdminResourceType;
  description?: string;
  remark?: string;
  pid?: string;
  is_visible?: boolean;
}

// Form validation errors
export interface ResourceFormErrors {
  name?: string;
  key?: string;
  code?: string;
  icon?: string;
  path?: string;
  type?: string;
  description?: string;
  remark?: string;
  pid?: string;
}

// Bulk operations
export interface BulkOperation {
  action: "create" | "update" | "delete";
  id?: string;
  data?: Partial<ResourceMenuItem>;
}

export interface BulkOperationsRequest {
  operations: BulkOperation[];
}
