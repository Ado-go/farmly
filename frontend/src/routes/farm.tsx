import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export const Route = createFileRoute("/farm")({
  component: FarmPage,
});

function FarmPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["farm"],
    queryFn: () => apiFetch("/farm"),
    retry: false,
  });

  if (isLoading) return <p>Loading farm…</p>;
  if (isError) return <p style={{ color: "red" }}>Cannot load farm</p>;

  return (
    <div>
      <h2>Farm: </h2>
    </div>
  );
}
