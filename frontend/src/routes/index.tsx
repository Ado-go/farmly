import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="space-y-8 px-4 py-8 max-w-3xl mx-auto">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold">Vitajte na Farmly 🌱</h1>
        <p className="font-semibold" style={{ color: "#c1121f" }}>
          Upozornenie: Toto je len testovacia verzia; žiadne objednávky sa
          nedoručia.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">O čom je tento web</h2>
        <p>
          Farmly spája miestnych farmárov so zákazníkmi a pomáha plánovať
          nákupy dopredu, aby nič neprišlo nazmar.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Objednávajte čerstvé produkty priamo od farmárov.</li>
          <li>Predobjednávajte si produkty na udalosti a trhy vo vašom meste.</li>
          <li>
            Pridajte vlastnú ponuku a zdieľajte úrodu či domáce produkty so
            svojím okolím.
          </li>
        </ul>
      </section>
    </main>
  );
}
