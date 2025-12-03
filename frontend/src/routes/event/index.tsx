import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

  const onSubmit = (data: EventFormData) => createEvent.mutate(data);

  const Section = ({ title, items }: { title: string; items: Event[] }) => (
    <div className="mb-10">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">{t("eventPage.noEvents")}</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((event) => (
            <Card
              key={event.id}
              onClick={() =>
                navigate({ to: "/event/$id", params: { id: String(event.id) } })
              }
              className="cursor-pointer hover:shadow-md transition overflow-hidden"
            >
              {(() => {
                const cover =
                  event.images?.[0]?.optimizedUrl || event.images?.[0]?.url;
                return cover ? (
                  <img
                    src={cover}
                    alt={event.title}
                    className="h-36 w-full object-cover"
                  />
                ) : (
                  <div className="h-36 w-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
                    {t("eventsDetail.noImage")}
                  </div>
                );
              })()}
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>
                  <strong>{t("eventPage.region")}:</strong> {event.region}
                </p>
                <p>
                  <strong>{t("eventPage.city")}:</strong> {event.city}
                </p>
                <p>
                  <strong>{t("eventPage.participants")}:</strong>{" "}
                  {event.participants.length}
                </p>
                <p>
                  <strong>{t("eventPage.from")}:</strong>{" "}
                  {format(new Date(event.startDate), "dd.MM.yyyy HH:mm")}
                </p>
                <p>
                  <strong>{t("eventPage.to")}:</strong>{" "}
                  {format(new Date(event.endDate), "dd.MM.yyyy HH:mm")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold">{t("eventPage.title")}</h2>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>{t("eventPage.addEvent")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("eventPage.newEvent")}</DialogTitle>
            </DialogHeader>

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-3 mt-2"
            >
              <ImageUploader
                value={images}
                onChange={setImages}
                editable
                height="h-56"
              />

              <Input
                placeholder={t("eventPage.name")}
                {...form.register("title")}
              />
              <Textarea
                placeholder={t("eventPage.description")}
                {...form.register("description")}
              />

              <div className="flex gap-2">
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

              <Input
                placeholder={t("eventPage.city")}
                {...form.register("city")}
              />
              <Input
                placeholder={t("eventPage.street")}
                {...form.register("street")}
              />
              <Input
                placeholder={t("eventPage.region")}
                {...form.register("region")}
              />
              <Input
                placeholder={t("eventPage.postalCode")}
                {...form.register("postalCode")}
              />
              <Input
                placeholder={t("eventPage.country")}
                {...form.register("country")}
              />

              <Button
                type="submit"
                className="w-full mt-3"
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

      <Section title={t("eventPage.myEvents")} items={myEvents} />
      <Section title={t("eventPage.joinedEvents")} items={joinedEvents} />
      <Section title={t("eventPage.otherEvents")} items={otherEvents} />
    </div>
  );
}
