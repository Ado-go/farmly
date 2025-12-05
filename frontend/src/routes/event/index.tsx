import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { apiFetch } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import DatePicker from "@/components/date-picker";
import { useAuth } from "@/context/AuthContext";
import type { Event } from "@/types/event";
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader";

const EVENT_LIMIT = 5;

const eventSchema = z.object({
  title: z.string().min(3, "Názov je povinný"),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  city: z.string().min(2, "Mesto je povinné"),
  street: z.string().min(2, "Ulica je povinná"),
  region: z.string().min(2, "Región je povinný"),
  postalCode: z.string().min(2, "PSČ je povinné"),
  country: z.string().min(2, "Krajina je povinná"),
});

type EventFormData = z.infer<typeof eventSchema>;

export const Route = createFileRoute("/event/")({
  component: EventPage,
});

function EventPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(),
      city: "",
      street: "",
      region: "",
      postalCode: "",
      country: "",
    },
  });
  const {
    formState: { errors },
  } = form;

  const {
    data: events = [],
    isLoading,
    isError,
  } = useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: async () => apiFetch("/event"),
  });

  const createEvent = useMutation({
    mutationFn: async (data: EventFormData) => {
      const uploaded: { url: string; publicId: string }[] = [];

      for (const img of images) {
        if (img.file) {
          const fd = new FormData();
          fd.append("image", img.file);
          const res = await apiFetch("/upload", { method: "POST", body: fd });
          uploaded.push({
            url: res.url,
            publicId: res.publicId,
          });
        } else if (img.url && img.publicId) {
          uploaded.push({
            url: img.url,
            publicId: img.publicId,
          });
        }
      }

      return await apiFetch("/event", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate.toISOString(),
          images: uploaded,
        }),
      });
    },
    onSuccess: () => {
      toast.success(t("eventPage.eventCreated"));
      setOpen(false);
      form.reset();
      setImages([]);
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: () => {
      toast.error(t("eventPage.errorCreating"));
    },
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        {t("eventPage.loading")}
      </div>
    );

  if (isError)
    return (
      <div className="text-red-500 text-center mt-10">
        {t("eventPage.errorLoading")}
      </div>
    );

  const myEvents = events.filter((e) => e.organizer.id === user?.id);
  const joinedEvents = events.filter(
    (e) =>
      e.participants.some((p) => p.id === user?.id) &&
      e.organizer.id !== user?.id
  );
  const otherEvents = events.filter(
    (e) =>
      e.organizer.id !== user?.id &&
      !e.participants.some((p) => p.id === user?.id)
  );

  const usedSlots = myEvents.length;
  const limitReached = usedSlots >= EVENT_LIMIT;
  const remainingSlots = Math.max(0, EVENT_LIMIT - usedSlots);

  const onSubmit = (data: EventFormData) => {
    if (limitReached) {
      toast.error(t("eventPage.limitReached"));
      return;
    }

    createEvent.mutate(data);
  };

  const Section = ({ title, items }: { title: string; items: Event[] }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-emerald-200 via-gray-200 to-transparent" />
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("eventPage.noEvents")}
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((event) => {
            const cover =
              event.images?.[0]?.optimizedUrl || event.images?.[0]?.url;
            return (
              <Card
                key={event.id}
                onClick={() =>
                  navigate({
                    to: "/event/$id",
                    params: { id: String(event.id) },
                  })
                }
                className="group cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition overflow-hidden border-2 border-transparent hover:border-emerald-100"
              >
                {cover ? (
                  <img
                    src={cover}
                    alt={event.title}
                    className="h-36 w-full object-cover"
                  />
                ) : (
                  <div className="h-36 w-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
                    {t("eventsDetail.noImage")}
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg leading-tight">
                    {event.title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(event.startDate), "dd.MM.yyyy")} •{" "}
                    {event.city}
                  </p>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md bg-emerald-50 text-emerald-800 px-2 py-1 text-xs font-semibold">
                      {event.region}
                    </div>
                    <div className="rounded-md bg-slate-50 text-slate-700 px-2 py-1 text-xs font-semibold text-right">
                      {t("eventPage.participants")}: {event.participants.length}
                    </div>
                  </div>
                  <div className="text-muted-foreground flex justify-between text-xs">
                    <span>
                      {t("eventPage.from")}:{" "}
                      {format(new Date(event.startDate), "dd.MM.yyyy HH:mm")}
                    </span>
                    <span>
                      {t("eventPage.to")}:{" "}
                      {format(new Date(event.endDate), "dd.MM.yyyy HH:mm")}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-emerald-700 hover:text-emerald-800"
                    >
                      {t("eventPage.openDetail")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="grid gap-4 lg:grid-cols-[1.5fr,1fr] items-stretch">
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-emerald-50 via-white to-lime-50 p-6">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(132,204,22,0.08),transparent_25%)]" />
          <div className="relative space-y-3">
            <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
              {t("eventPage.title")}
            </p>
            <h2 className="text-3xl font-bold leading-tight">
              {t("eventPage.subtitle")}
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              {t("eventPage.subtitleBody")}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
                {t("eventPage.myEvents")}: {myEvents.length}
              </span>
              <span className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-amber-700">
                {t("eventPage.joinedEvents")}: {joinedEvents.length}
              </span>
              <span className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                {t("eventPage.otherEvents")}: {otherEvents.length}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("eventPage.limitTitle")}
              </p>
              <p className="font-semibold">
                {t("eventPage.limitRemaining", {
                  remaining: remainingSlots,
                  limit: EVENT_LIMIT,
                })}
              </p>
            </div>
            <div
              className={`text-xs font-semibold rounded-full px-3 py-1 ${
                limitReached
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {limitReached
                ? t("eventPage.limitReachedShort")
                : t("eventPage.addEvent")}
            </div>
          </div>

          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                limitReached ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${(usedSlots / EVENT_LIMIT) * 100}%` }}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            {limitReached
              ? t("eventPage.limitReached")
              : t("eventPage.limitHelper", { limit: EVENT_LIMIT })}
          </p>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" disabled={limitReached}>
                {t("eventPage.addEvent")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl w-[min(95vw,48rem)] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("eventPage.newEvent")}</DialogTitle>
                <DialogDescription>
                  {t("eventPage.formIntro")}
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 mt-2"
              >
                <div className="space-y-2">
                  <Label>{t("eventPage.images")}</Label>
                  <ImageUploader
                    value={images}
                    onChange={setImages}
                    editable
                    height="h-56"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="title">{t("eventPage.name")}</Label>
                  <Input
                    id="title"
                    placeholder={t("eventPage.name")}
                    {...form.register("title")}
                  />
                  {errors.title?.message && (
                    <p className="text-xs text-destructive">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">
                    {t("eventPage.description")}
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={t("eventPage.description")}
                    {...form.register("description")}
                  />
                  {errors.description?.message && (
                    <p className="text-xs text-destructive">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <DatePicker
                    label={t("eventPage.startDate")}
                    date={form.watch("startDate")}
                    onSelect={(date) =>
                      form.setValue("startDate", date || new Date())
                    }
                  />
                  <DatePicker
                    label={t("eventPage.endDate")}
                    date={form.watch("endDate")}
                    onSelect={(date) =>
                      form.setValue("endDate", date || new Date())
                    }
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="city">{t("eventPage.city")}</Label>
                    <Input
                      id="city"
                      placeholder={t("eventPage.city")}
                      {...form.register("city")}
                    />
                    {errors.city?.message && (
                      <p className="text-xs text-destructive">{errors.city.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="street">{t("eventPage.street")}</Label>
                    <Input
                      id="street"
                      placeholder={t("eventPage.street")}
                      {...form.register("street")}
                    />
                    {errors.street?.message && (
                      <p className="text-xs text-destructive">{errors.street.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="region">{t("eventPage.region")}</Label>
                    <Input
                      id="region"
                      placeholder={t("eventPage.region")}
                      {...form.register("region")}
                    />
                    {errors.region?.message && (
                      <p className="text-xs text-destructive">{errors.region.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="postalCode">
                      {t("eventPage.postalCode")}
                    </Label>
                    <Input
                      id="postalCode"
                      placeholder={t("eventPage.postalCode")}
                      {...form.register("postalCode")}
                    />
                    {errors.postalCode?.message && (
                      <p className="text-xs text-destructive">
                        {errors.postalCode.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="country">{t("eventPage.country")}</Label>
                    <Input
                      id="country"
                      placeholder={t("eventPage.country")}
                      {...form.register("country")}
                    />
                    {errors.country?.message && (
                      <p className="text-xs text-destructive">{errors.country.message}</p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-1"
                  disabled={createEvent.isPending}
                >
                  {createEvent.isPending
                    ? t("eventPage.creating")
                    : t("eventPage.create")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Section title={t("eventPage.myEvents")} items={myEvents} />
      <Section title={t("eventPage.joinedEvents")} items={joinedEvents} />
      <Section title={t("eventPage.otherEvents")} items={otherEvents} />
    </div>
  );
}
