"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

const ADMINS_PATH = "/dashboard/admins";

// Every dashboard user is a trusted admin, so any signed-in user may manage
// admins — but re-check auth here (defense in depth; server actions are their
// own entrypoint, not covered by the page's middleware guard).
async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authorized");
  return userId;
}

async function getOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function inviteAdmin(email: string) {
  await requireAdmin();
  const trimmed = email.trim();
  if (!trimmed) throw new Error("Email is required");

  const client = await clerkClient();
  const origin = await getOrigin();
  await client.invitations.createInvitation({
    emailAddress: trimmed,
    redirectUrl: `${origin}/sign-up`,
    ignoreExisting: true,
  });
  revalidatePath(ADMINS_PATH);
}

export async function revokeInvitation(invitationId: string) {
  await requireAdmin();
  const client = await clerkClient();
  await client.invitations.revokeInvitation(invitationId);
  revalidatePath(ADMINS_PATH);
}

export async function removeAdmin(targetUserId: string) {
  const userId = await requireAdmin();
  if (targetUserId === userId) {
    throw new Error("You can't remove yourself");
  }
  const client = await clerkClient();
  await client.users.deleteUser(targetUserId);
  revalidatePath(ADMINS_PATH);
}
