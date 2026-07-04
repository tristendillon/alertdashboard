import { auth, clerkClient } from "@clerk/nextjs/server";
import { AdminsView } from "./_components/admins-view";

export default async function AdminsPage() {
  const { userId } = await auth();
  const client = await clerkClient();
  const [userList, inviteList] = await Promise.all([
    client.users.getUserList({ limit: 100, orderBy: "-created_at" }),
    client.invitations.getInvitationList({ status: "pending", limit: 100 }),
  ]);

  const users = userList.data.map((u) => ({
    id: u.id,
    email:
      u.primaryEmailAddress?.emailAddress ??
      u.emailAddresses[0]?.emailAddress ??
      "",
    name: [u.firstName, u.lastName].filter(Boolean).join(" ") || null,
    lastSignInAt: u.lastSignInAt ?? null,
    banned: u.banned,
  }));

  const pendingInvitations = inviteList.data.map((i) => ({
    id: i.id,
    email: i.emailAddress,
    createdAt: i.createdAt,
  }));

  return (
    <AdminsView
      users={users}
      pendingInvitations={pendingInvitations}
      currentUserId={userId ?? null}
    />
  );
}
