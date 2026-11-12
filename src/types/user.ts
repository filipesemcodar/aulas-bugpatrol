export type UserRole = "owner" | "admin" | "member";

export interface User {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
}
