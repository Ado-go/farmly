import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
});

function ProductsPage() {
  return (
    <div>
      <h2>Products</h2>
      <p>Here will be the product list...</p>
    </div>
  );
}
