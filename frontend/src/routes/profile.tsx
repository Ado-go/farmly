import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div>
      <h2>Your Profile</h2>
      <p>This page will later be protected by auth middleware.</p>
    </div>
  );
}
