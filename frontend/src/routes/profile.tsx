import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { setUser } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile"],
    queryFn: () => apiFetch("/profile"),
    retry: false,
  });

  useEffect(() => {
    if (data?.user) {
      setUser(data.user);
    }
  }, [data, setUser]);

  if (isLoading) return <p>Loading profile…</p>;
  if (isError) return <p style={{ color: "red" }}>Cannot load profile</p>;

  const user = data.user;
  return (
    <div>
      <h2>Profile</h2>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      <p>Phone: {user.phone}</p>
    </div>
  );
}
