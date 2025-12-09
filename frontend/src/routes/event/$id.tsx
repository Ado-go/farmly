import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import DatePicker from "@/components/date-picker";
import { EventProductsSection } from "@/components/EventProductsSection";
import { useAuth } from "@/context/AuthContext";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import type { TFunction } from "i18next";
import type { Event } from "@/types/event";
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader";
import { ImageCarousel } from "@/components/ImageCarousel";

const buildEventSchema = (t: TFunction) => {
  const dateField = (msgKey: string) =>
    z
      .any()
      .refine(
        (val) => val instanceof Date && !Number.isNaN((val as Date).getTime()),
        { message: t(msgKey) }
      )
      .transform((val) => val as Date);

  return z.object({
    title: z.string().min(3, t("eventPage.errors.title")),
    description: z.string().optional(),
    startDate: dateField("eventPage.errors.startDate"),
    endDate: dateField("eventPage.errors.endDate"),
    city: z.string().min(2, t("eventPage.errors.city")),
    street: z.string().min(2, t("eventPage.errors.street")),
    region: z.string().min(2, t("eventPage.errors.region")),
    postalCode: z.string().min(2, t("eventPage.errors.postalCode")),
    country: z.string().min(2, t("eventPage.errors.country")),
  });
};

type EventFormData = z.infer<ReturnType<typeof buildEventSchema>>;

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
  const [images, setImages] = useState<UploadedImage[]>([]);

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ["event", id],
    queryFn: async () => apiFetch(`/event/${id}`),
  });

  const eventImages = useMemo(
    () =>
      event?.images
        ? event.images.map((img) => ({
            url: img.optimizedUrl || img.url,
            publicId: img.publicId,
            optimizedUrl: img.optimizedUrl,
          }))
        : [],
    [event]
  );

  useEffect(() => {
    setImages(eventImages);
  }, [eventImages]);

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
    mutationFn: async (data: EventFormData & { images: UploadedImage[] }) => {
      const uploaded: { url: string; publicId: string }[] = [];

      for (const img of data.images) {
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

      return apiFetch(`/event/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...data,
          images: uploaded,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate.toISOString(),
        }),
      });
    },
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

  const displayImages =
    images?.map((img) => ({ url: img.optimizedUrl || img.url })) ?? [];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-50 via-white to-lime-50 border-b">
          <p className="text-xs uppercase text-emerald-700 font-semibold">
            {t("eventPage.from")}:{" "}
            {format(new Date(event.startDate), "dd.MM.yyyy HH:mm")}
          </p>
          <CardTitle className="text-3xl leading-tight">
            {event.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {event.city}, {event.region} • {event.country}
          </p>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          {editMode ? (
            <EditForm
              event={event}
              t={t}
              onSave={updateEvent.mutate}
              isSaving={updateEvent.isPending}
              onCancel={() => {
                setImages(eventImages);
                setEditMode(false);
              }}
              images={images}
              onImagesChange={setImages}
            />
          ) : (
            <div className="space-y-6">
              {displayImages.length > 0 ? (
                <ImageCarousel
                  images={displayImages}
                  editable={false}
                  height="h-64"
                />
              ) : (
                <div className="w-full h-64 bg-muted flex items-center justify-center rounded text-muted-foreground">
                  {t("eventsDetail.noImage")}
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-[1.25fr,0.9fr]">
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {t("eventPage.description")}
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {event.description || t("eventsPage.noDescription")}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <InfoTile
                      label={t("eventPage.from")}
                      value={format(
                        new Date(event.startDate),
                        "dd.MM.yyyy HH:mm"
                      )}
                    />
                    <InfoTile
                      label={t("eventPage.to")}
                      value={format(
                        new Date(event.endDate),
                        "dd.MM.yyyy HH:mm"
                      )}
                    />
                    <InfoTile label={t("eventPage.city")} value={event.city} />
                    <InfoTile
                      label={t("eventPage.street")}
                      value={event.street}
                    />
                    <InfoTile
                      label={t("eventPage.region")}
                      value={event.region}
                    />
                    <InfoTile
                      label={t("eventPage.postalCode")}
                      value={event.postalCode}
                    />
                    <InfoTile
                      label={t("eventPage.country")}
                      value={event.country}
                    />
                    <InfoTile
                      label={t("eventPage.participants")}
                      value={event.participants.length}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-lg border p-4 bg-white shadow-sm space-y-3">
                    <p className="text-xs uppercase text-muted-foreground font-semibold">
                      {t("eventPage.organizer")}
                    </p>
                    <div className="flex items-center gap-3">
                      <ProfileAvatar
                        imageUrl={event.organizer.profileImageUrl}
                        name={event.organizer.name}
                        size={42}
                      />
                      <div>
                        <p className="font-semibold">{event.organizer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.organizer.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 bg-emerald-50/70 space-y-3">
                    <p className="text-sm font-semibold text-emerald-900">
                      {t("eventPage.actionsTitle")}
                    </p>
                    <p className="text-xs text-emerald-900/80">
                      {isOrganizer
                        ? t("eventPage.actionsOrganizer")
                        : isParticipant
                          ? t("eventPage.actionsParticipant")
                          : t("eventPage.actionsVisitor")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {isOrganizer ? (
                        <>
                          <Button onClick={() => setEditMode(true)}>
                            {t("eventPage.edit")}
                          </Button>

                          <Dialog
                            open={deleteDialog}
                            onOpenChange={setDeleteDialog}
                          >
                            <DialogTrigger asChild>
                              <Button variant="destructive">
                                {t("eventPage.delete")}
                              </Button>
                            </DialogTrigger>
                          <DialogContent className="sm:max-w-md w-[min(92vw,26rem)]">
                              <DialogHeader>
                                <DialogTitle>
                                  {t("eventPage.confirmDelete")}
                                </DialogTitle>
                              </DialogHeader>
                              <p className="text-sm text-muted-foreground">
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
                  </div>
                </div>
              </div>
            </div>
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
            <p className="text-muted-foreground">
              {t("eventPage.noParticipants")}
            </p>
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

function InfoTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-sm text-slate-900">{value}</p>
    </div>
  );
}

type EditFormProps = {
  event: Event;
  onSave: (data: EventFormData & { images: UploadedImage[] }) => void;
  onCancel: () => void;
  t: TFunction;
  images: UploadedImage[];
  onImagesChange: (imgs: UploadedImage[]) => void;
  isSaving: boolean;
};

function EditForm({
  event,
  onSave,
  onCancel,
  t,
  images,
  onImagesChange,
  isSaving,
}: EditFormProps) {
  const schema = useMemo(() => buildEventSchema(t), [t]);
  const form = useForm<EventFormData>({
    resolver: zodResolver(schema),
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
  const {
    formState: { errors },
  } = form;

  const onSubmit = (data: EventFormData) =>
    onSave({
      ...data,
      images,
    });

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4 text-sm mt-2"
    >
      <div className="space-y-2">
        <Label>{t("eventPage.images")}</Label>
        <ImageUploader
          value={images}
          onChange={onImagesChange}
          editable
          height="h-56"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-title">{t("eventPage.name")}</Label>
        <Input
          id="edit-title"
          {...form.register("title")}
          placeholder={t("eventPage.name")}
        />
        {errors.title?.message && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-description">{t("eventPage.description")}</Label>
        <Textarea
          id="edit-description"
          {...form.register("description")}
          placeholder={t("eventPage.description")}
        />
        {errors.description?.message && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
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
      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="edit-city">{t("eventPage.city")}</Label>
          <Input
            id="edit-city"
            {...form.register("city")}
            placeholder={t("eventPage.city")}
          />
          {errors.city?.message && (
            <p className="text-xs text-destructive">{errors.city.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-street">{t("eventPage.street")}</Label>
          <Input
            id="edit-street"
            {...form.register("street")}
            placeholder={t("eventPage.street")}
          />
          {errors.street?.message && (
            <p className="text-xs text-destructive">{errors.street.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-region">{t("eventPage.region")}</Label>
          <Input
            id="edit-region"
            {...form.register("region")}
            placeholder={t("eventPage.region")}
          />
          {errors.region?.message && (
            <p className="text-xs text-destructive">{errors.region.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-postal">{t("eventPage.postalCode")}</Label>
          <Input
            id="edit-postal"
            {...form.register("postalCode")}
            placeholder={t("eventPage.postalCode")}
          />
          {errors.postalCode?.message && (
            <p className="text-xs text-destructive">{errors.postalCode.message}</p>
          )}
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="edit-country">{t("eventPage.country")}</Label>
          <Input
            id="edit-country"
            {...form.register("country")}
            placeholder={t("eventPage.country")}
          />
          {errors.country?.message && (
            <p className="text-xs text-destructive">{errors.country.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? t("eventPage.saving") : t("eventPage.save")}
        </Button>
        <Button variant="secondary" type="button" onClick={onCancel}>
          {t("eventPage.cancel")}
        </Button>
      </div>
    </form>
  );
}
