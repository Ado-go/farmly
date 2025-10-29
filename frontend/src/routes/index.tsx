import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { t } = useTranslation();
  return (
    <>
      <h1>{t("welcome")} 🌱</h1>
    </>
  );
}
