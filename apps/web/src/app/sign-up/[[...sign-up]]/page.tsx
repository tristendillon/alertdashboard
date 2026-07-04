import { SignUp } from "@clerk/nextjs";

// Reachable via a Clerk invitation link (carries __clerk_ticket), so an invited
// admin can finish creating their account even though public sign-up is closed.
export default function Page() {
  return (
    <div className="flex h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
