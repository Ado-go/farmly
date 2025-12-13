import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/types/user";
import { useTranslation } from "react-i18next";
import { registerSchema, type RegisterForm } from "@/schemas/authSchema";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegistrationHero } from "@/components/registration/RegistrationHero";
import { RoleSelection } from "@/components/registration/RoleSelection";
import { RegistrationDetailsForm } from "@/components/registration/RegistrationDetailsForm";
import type { RegistrationRole } from "@/types/registration";
import { ShieldCheck, ShoppingBasket, Tractor } from "lucide-react";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const { t } = useTranslation();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "CUSTOMER" },
  });

  const selectedRole: RegistrationRole = watch("role") ?? "CUSTOMER";

  const registerMut = useMutation({
    mutationFn: async (values: RegisterForm) =>
      apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(values),
      }),
  });

  const loginMut = useMutation({
    mutationFn: async (values: { email: string; password: string }) =>
      apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: (data: { user: User }) => {
      setUser(data.user);
      qc.invalidateQueries({ queryKey: ["profile"] });
      navigate({ to: "/" });
    },
  });

  const onSubmit = async (values: RegisterForm) => {
    await registerMut.mutateAsync(values);
    await loginMut.mutateAsync({
      email: values.email,
      password: values.password,
    });
  };

  const isPending = registerMut.isPending || loginMut.isPending;
  const serverError =
    registerMut.isError || loginMut.isError
      ? (registerMut.error as Error)?.message ||
        (loginMut.error as Error)?.message
      : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Card className="w-full overflow-hidden border-primary/15 bg-white/95 shadow-2xl backdrop-blur">
          <div className="grid items-stretch md:grid-cols-[1.05fr_0.95fr] md:min-h-[680px]">
            <div className="relative hidden h-full overflow-hidden text-primary-foreground md:flex">
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-emerald-600 to-emerald-500" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_32%)]" />

              <RegistrationHero
                brand={t("farmly")}
                heading={t("registerPage.heroHeading")}
                description={t("registerPage.heroDescription")}
                bulletsTitle={t("registerPage.heroBulletsTitle")}
                bullets={[
                  {
                    icon: ShoppingBasket,
                    title: t("registerPage.highlightShop"),
                    description: t("registerPage.highlightShopDesc"),
                  },
                  {
                    icon: Tractor,
                    title: t("registerPage.highlightGrow"),
                    description: t("registerPage.highlightGrowDesc"),
                  },
                  {
                    icon: ShieldCheck,
                    title: t("registerPage.highlightTrust"),
                    description: t("registerPage.highlightTrustDesc"),
                  },
                ]}
              />
            </div>

            <div className="relative flex h-full flex-col p-6 sm:p-10">
              <CardHeader className="space-y-3 p-0">
                <CardTitle className="flex items-center gap-2 text-3xl">
                  {t("registerPage.title")}
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  {t("registerPage.subtitle")}
                </CardDescription>
              </CardHeader>

              <div className="mt-6 space-y-6">
                <RoleSelection
                  label={t("registerPage.roleLabel")}
                  description={t("registerPage.roleStepDescription")}
                  activeLabel={
                    selectedRole === "FARMER"
                      ? t("registerPage.roleFarmer")
                      : t("registerPage.roleCustomer")
                  }
                  roles={[
                    {
                      value: "CUSTOMER",
                      title: t("registerPage.roleCustomer"),
                      description: t("registerPage.roleCustomerDesc"),
                      icon: ShoppingBasket,
                    },
                    {
                      value: "FARMER",
                      title: t("registerPage.roleFarmer"),
                      description: t("registerPage.roleFarmerDesc"),
                      icon: Tractor,
                    },
                  ]}
                  selectedRole={selectedRole}
                  onSelect={(value) =>
                    setValue("role", value, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                  }
                />

                <RegistrationDetailsForm
                  onSubmit={handleSubmit(onSubmit)}
                  register={register}
                  errors={errors}
                  t={t}
                  isPending={isPending}
                  serverError={serverError}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
