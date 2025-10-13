import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <h1>Welcome to Farmly 🌱</h1> <Button>Stlač ma</Button>
    </>
  );
}
