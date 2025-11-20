import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { apiFetch } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import DatePicker from "@/components/date-picker";
import { EventProductsSection } from "@/components/EventProductsSection";
import { useAuth } from "@/context/AuthContext";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import type { TFunction } from "i18next";
import type { Event } from "@/types/event";

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

export const Route = createFileRoute("/event/$id")({
  component: EventDetailPage,
});

function EventDetailPage() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ["event", id],
    queryFn: async () => apiFetch(`/event/${id}`),
  });

  const isOrganizer = event?.organizer.id === user?.id;
  const isParticipant = event?.participants.some((p) => p.id === user?.id);

  const joinEvent = useMutation({
    mutationFn: () => apiFetch(`/event/${id}/join`, { method: "POST" }),
    onSuccess: () => {
      toast.success(t("eventPage.joined"));
      queryClient.invalidateQueries({ queryKey: ["event", id] });
    },
  });

  const leaveEvent = useMutation({
    mutationFn: () => apiFetch(`/event/${id}/leave`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success(t("eventPage.left"));
      queryClient.invalidateQueries({ queryKey: ["event", id] });
    },
  });

  const updateEvent = useMutation({
    mutationFn: (data: EventFormData) =>
      apiFetch(`/event/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...data,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate.toISOString(),
        }),
      }),
    onSuccess: () => {
      toast.success(t("eventPage.updated"));
      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: ["event", id] });
    },
    onError: () => toast.error(t("eventPage.errorUpdating")),
  });

  const deleteEvent = useMutation({
    mutationFn: () => apiFetch(`/event/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success(t("eventPage.deleted"));
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate({ to: "/event" });
    },
    onError: () => toast.error(t("eventPage.errorDeleting")),
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        {t("eventPage.loading")}
      </div>
    );

  if (!event)
    return (
      <div className="text-center text-gray-500 mt-10">
        {t("eventPage.notFound")}
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {editMode ? (
            <EditForm
              event={event}
              t={t}
              onSave={updateEvent.mutate}
              onCancel={() => setEditMode(false)}
            />
          ) : (
            <>
              <p>
                <strong>{t("eventPage.description")}:</strong>{" "}
                {event.description || "—"}
              </p>
              <p>
                <strong>{t("eventPage.city")}:</strong> {event.city}
              </p>
              <p>
                <strong>{t("eventPage.region")}:</strong> {event.region}
              </p>
              <p>
                <strong>{t("eventPage.from")}:</strong>{" "}
                {format(new Date(event.startDate), "dd.MM.yyyy HH:mm")}
              </p>
              <p>
                <strong>{t("eventPage.to")}:</strong>{" "}
                {format(new Date(event.endDate), "dd.MM.yyyy HH:mm")}
              </p>
              <p>
                <strong>{t("eventPage.organizer")}:</strong>{" "}
                {event.organizer.name} ({event.organizer.email})
              </p>

              <div className="mt-4 flex gap-2">
                {isOrganizer ? (
                  <>
                    <Button onClick={() => setEditMode(true)}>
                      {t("eventPage.edit")}
                    </Button>

                    <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                      <DialogTrigger asChild>
                        <Button variant="destructive">
                          {t("eventPage.delete")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {t("eventPage.confirmDelete")}
                          </DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-gray-600">
                          {t("eventPage.deleteMessage")}
                        </p>
                        <DialogFooter className="mt-4 flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => setDeleteDialog(false)}
                          >
                            {t("eventPage.cancel")}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              deleteEvent.mutate();
                              setDeleteDialog(false);
                            }}
                          >
                            {t("eventPage.confirm")}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : isParticipant ? (
                  <Button
                    variant="destructive"
                    onClick={() => leaveEvent.mutate()}
                  >
                    {t("eventPage.leave")}
                  </Button>
                ) : (
                  <Button onClick={() => joinEvent.mutate()}>
                    {t("eventPage.join")}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("eventPage.participants")} ({event.participants.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {event.participants.length === 0 ? (
            <p>{t("eventPage.noParticipants")}</p>
          ) : (
            event.participants.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <ProfileAvatar
                  imageUrl={p.profileImageUrl}
                  name={p.name}
                  size={36}
                />
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.email}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      {isParticipant && user?.role === "FARMER" && (
        <EventProductsSection eventId={Number(id)} />
      )}
    </div>
  );
}

type EditFormProps = {
  event: Event;
  onSave: (data: EventFormData) => void;
  onCancel: () => void;
  t: TFunction;
};

function EditForm({ event, onSave, onCancel, t }: EditFormProps) {
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event.title,
      description: event.description ?? undefined,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      city: event.city,
      street: event.street,
      region: event.region,
      postalCode: event.postalCode,
      country: event.country,
    },
  });

  const onSubmit = (data: EventFormData) => onSave(data);

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-2 text-sm mt-2"
    >
      <Input {...form.register("title")} placeholder={t("eventPage.name")} />
      <Textarea
        {...form.register("description")}
        placeholder={t("eventPage.description")}
      />
      <div className="flex gap-2">
        <DatePicker
          label={t("eventPage.startDate")}
          date={form.watch("startDate")}
          onSelect={(date) => form.setValue("startDate", date || new Date())}
        />
        <DatePicker
          label={t("eventPage.endDate")}
          date={form.watch("endDate")}
          onSelect={(date) => form.setValue("endDate", date || new Date())}
        />
      </div>
      <Input {...form.register("city")} placeholder={t("eventPage.city")} />
      <Input {...form.register("street")} placeholder={t("eventPage.street")} />
      <Input {...form.register("region")} placeholder={t("eventPage.region")} />
      <Input
        {...form.register("postalCode")}
        placeholder={t("eventPage.postalCode")}
      />
      <Input
        {...form.register("country")}
        placeholder={t("eventPage.country")}
      />

      <div className="flex gap-2 mt-3">
        <Button type="submit">{t("eventPage.save")}</Button>
        <Button variant="secondary" onClick={onCancel}>
          {t("eventPage.cancel")}
        </Button>
      </div>
    </form>
  );
}
