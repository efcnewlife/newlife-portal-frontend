import type { User } from "@/types/auth";

type UserDisplayNameInput = Pick<User, "firstName" | "lastName" | "preferredName" | "email">;

type AdminUserNameInput = {
  first_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
  email?: string | null;
};

/** Fallback: preferredName > first+last > email > Anonymous */
export const format_user_display_name = (user: UserDisplayNameInput): string => {
  const preferred_name = user.preferredName?.trim();
  if (preferred_name) {
    return preferred_name;
  }
  const full_name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (full_name) {
    return full_name;
  }
  const email = user.email?.trim();
  if (email) {
    return email;
  }
  return "Anonymous";
};

/** Fallback: preferred_name > first+last > email > empty string */
export const format_admin_user_label = (user: AdminUserNameInput): string => {
  const preferred_name = user.preferred_name?.trim();
  if (preferred_name) {
    return preferred_name;
  }
  const full_name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  if (full_name) {
    return full_name;
  }
  return user.email?.trim() || "";
};
