import { api, command } from "./client";
import { bearer } from "../auth/store";

/** One admin account, as the setup wizard shows it. */
export interface AdminAccount {
  id: string;
  name: string;
  phone: string;
  /** the SUPER_ADMIN_PHONE account: cannot lose the admin role */
  superAdmin: boolean;
}

export interface AdminsInfo {
  admins: AdminAccount[];
  /** public URL of the app (empty when APP_URL is not configured) */
  appUrl: string;
  /** whether an SMS can actually carry the invite link */
  smsEnabled: boolean;
}

/** Everyone who manages the app + the link an invite carries. */
export async function listAdmins(token: string): Promise<AdminsInfo> {
  return api<AdminsInfo>("/api/admins", { headers: bearer(token) });
}

export interface AddedAdmin {
  admin: AdminAccount;
  appUrl: string;
  /** true when the invite SMS went out */
  smsSent: boolean;
}

/**
 * Grants the admin role to a phone (login + roster records are created when
 * needed) and texts the person the app link. `sendSms: false` skips the text.
 */
export async function addAdmin(token: string, input: { name: string; phone: string; sendSms?: boolean }): Promise<AddedAdmin> {
  return command<AddedAdmin>(
    "/api/admins",
    { method: "POST", headers: { ...bearer(token), "content-type": "application/json" }, body: JSON.stringify(input) },
    ["staff"],
  );
}

/** Removes the admin role from an account (never your own, never the deployment owner's). */
export async function removeAdmin(token: string, id: string): Promise<void> {
  await command(`/api/admins/${id}`, { method: "DELETE", headers: bearer(token) }, ["staff"]);
}
