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
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { apiFetch } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import DatePicker from "@/components/date-picker";
import { useAuth } from "@/context/AuthContext";
import type { Event } from "@/types/event";
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader";
import { PaginationControls } from "@/components/PaginationControls";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REGION_OPTIONS } from "@/constants/regions";
import {
  buildEventSchema,
  type EventFormData,
} from "@/schemas/eventSchema";

const EVENT_LIMIT = 5;
const EVENTS_PAGE_SIZE = 6;

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
  const [myPage, setMyPage] = useState(1);
  const [joinedPage, setJoinedPage] = useState(1);
  const [otherPage, setOtherPage] = useState(1);
  const schema = useMemo(() => buildEventSchema(t), [t]);
  const inputTone =
    "bg-white/80 border-emerald-100 focus-visible:ring-emerald-200 focus:border-emerald-400";

  const form = useForm<EventFormData>({
    resolver: zodResolver(schema),
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

  const eventsList = events ?? [];
  const myEvents = eventsList.filter((e) => e.organizer.id === user?.id);
  const joinedEvents = eventsList.filter(
    (e) =>
      e.participants.some((p) => p.id === user?.id) &&
      e.organizer.id !== user?.id
  );
  const otherEvents = eventsList.filter(
    (e) =>
      e.organizer.id !== user?.id &&
      !e.participants.some((p) => p.id === user?.id)
  );

  const myTotalPages = Math.max(
    1,
    Math.ceil((myEvents.length || 0) / EVENTS_PAGE_SIZE)
  );
  const joinedTotalPages = Math.max(
    1,
    Math.ceil((joinedEvents.length || 0) / EVENTS_PAGE_SIZE)
  );
  const otherTotalPages = Math.max(
    1,
    Math.ceil((otherEvents.length || 0) / EVENTS_PAGE_SIZE)
  );

  const paginatedMyEvents = myEvents.slice(
    (myPage - 1) * EVENTS_PAGE_SIZE,
    myPage * EVENTS_PAGE_SIZE
  );
  const paginatedJoinedEvents = joinedEvents.slice(
    (joinedPage - 1) * EVENTS_PAGE_SIZE,
    joinedPage * EVENTS_PAGE_SIZE
  );
  const paginatedOtherEvents = otherEvents.slice(
    (otherPage - 1) * EVENTS_PAGE_SIZE,
    otherPage * EVENTS_PAGE_SIZE
  );

  useEffect(() => {
    if (myPage > myTotalPages) setMyPage(myTotalPages);
  }, [myPage, myTotalPages]);

  useEffect(() => {
    if (joinedPage > joinedTotalPages) setJoinedPage(joinedTotalPages);
  }, [joinedPage, joinedTotalPages]);

  useEffect(() => {
    if (otherPage > otherTotalPages) setOtherPage(otherTotalPages);
  }, [otherPage, otherTotalPages]);

  const clampPage = (next: number, total: number) =>
    Math.min(Math.max(1, next), total);

  const handleMyPageChange = (next: number) => {
    const clamped = clampPage(next, myTotalPages);
    if (clamped !== myPage) setMyPage(clamped);
  };

  const handleJoinedPageChange = (next: number) => {
    const clamped = clampPage(next, joinedTotalPages);
    if (clamped !== joinedPage) setJoinedPage(clamped);
  };

  const handleOtherPageChange = (next: number) => {
    const clamped = clampPage(next, otherTotalPages);
    if (clamped !== otherPage) setOtherPage(clamped);
  };

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

  const Section = ({
    title,
    items,
    page,
    totalPages,
    onPageChange,
  }: {
    title: string;
    items: Event[];
    page?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
  }) => (
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
        <>
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
                        {t("eventPage.participants")}:{" "}
                        {event.participants.length}
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

          {totalPages && totalPages > 1 && onPageChange ? (
            <PaginationControls
              page={page ?? 1}
              totalPages={totalPages}
              onPageChange={onPageChange}
              prevLabel={t("pagination.previous")}
              nextLabel={t("pagination.next")}
              className="pt-2"
            />
          ) : null}
        </>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="grid gap-4 lg:grid-cols-[1.5fr,1fr] items-stretch">
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-emerald-50 via-white to-lime-50 p-6 shadow-sm">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.08),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(251,191,36,0.1),transparent_32%)]" />
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
                <DialogTitle className="space-y-1">
                  <span className="block text-xs uppercase tracking-[0.28em] text-emerald-700">
                    {t("eventPage.title")}
                  </span>
                  <span className="text-2xl font-semibold">
                    {t("eventPage.newEvent")}
                  </span>
                  <p className="text-sm font-normal text-muted-foreground">
                    {t("eventPage.formIntro")}
                  </p>
                </DialogTitle>
              </DialogHeader>

              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="mt-2 space-y-5"
                noValidate
              >
                <div className="space-y-2">
                  <FieldLabel className="text-sm font-medium">
                    {t("eventPage.images")}
                  </FieldLabel>
                  <ImageUploader
                    value={images}
                    onChange={setImages}
                    editable
                    height="h-56"
                  />
                </div>

                <FieldSet className="grid grid-cols-1 gap-4">
                  <Field>
                    <FieldLabel htmlFor="title">
                      {t("eventPage.name")}
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id="title"
                        placeholder={t("eventPage.name")}
                        className={inputTone}
                        {...form.register("title")}
                      />
                      <FieldError
                        errors={errors.title ? [errors.title] : undefined}
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="description">
                      {t("eventPage.description")}
                    </FieldLabel>
                    <FieldContent>
                      <Textarea
                        id="description"
                        placeholder={t("eventPage.description")}
                        className={inputTone}
                        {...form.register("description")}
                      />
                      <FieldError
                        errors={
                          errors.description ? [errors.description] : undefined
                        }
                      />
                    </FieldContent>
                  </Field>

                  <FieldSet className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel>{t("eventPage.startDate")}</FieldLabel>
                      <FieldContent>
                        <DatePicker
                          date={form.watch("startDate")}
                          onSelect={(date) =>
                            form.setValue("startDate", date || new Date())
                          }
                          buttonClassName={inputTone}
                        />
                        <FieldError
                          errors={
                            errors.startDate ? [errors.startDate] : undefined
                          }
                        />
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel>{t("eventPage.endDate")}</FieldLabel>
                      <FieldContent>
                        <DatePicker
                          date={form.watch("endDate")}
                          onSelect={(date) =>
                            form.setValue("endDate", date || new Date())
                          }
                          buttonClassName={inputTone}
                        />
                        <FieldError
                          errors={errors.endDate ? [errors.endDate] : undefined}
                        />
                      </FieldContent>
                    </Field>
                  </FieldSet>

                  <FieldSet className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="city">
                        {t("eventPage.city")}
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          id="city"
                          placeholder={t("eventPage.city")}
                          className={inputTone}
                          {...form.register("city")}
                        />
                        <FieldError
                          errors={errors.city ? [errors.city] : undefined}
                        />
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="street">
                        {t("eventPage.street")}
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          id="street"
                          placeholder={t("eventPage.street")}
                          className={inputTone}
                          {...form.register("street")}
                        />
                        <FieldError
                          errors={errors.street ? [errors.street] : undefined}
                        />
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="region">
                        {t("eventPage.region")}
                      </FieldLabel>
                      <FieldContent>
                        <Controller
                          control={form.control}
                          name="region"
                          render={({ field }) => (
                            <Select
                              value={field.value || ""}
                              onValueChange={(value) => field.onChange(value)}
                            >
                              <SelectTrigger
                                id="region"
                                className={`${inputTone} w-full`}
                                onBlur={field.onBlur}
                              >
                                <SelectValue
                                  placeholder={t("eventPage.region")}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {REGION_OPTIONS.map((region) => (
                                  <SelectItem
                                    key={region.value}
                                    value={region.value}
                                  >
                                    {region.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <FieldError
                          errors={errors.region ? [errors.region] : undefined}
                        />
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="postalCode">
                        {t("eventPage.postalCode")}
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          id="postalCode"
                          placeholder={t("eventPage.postalCode")}
                          className={inputTone}
                          {...form.register("postalCode")}
                        />
                        <FieldError
                          errors={
                            errors.postalCode ? [errors.postalCode] : undefined
                          }
                        />
                      </FieldContent>
                    </Field>
                    <Field className="md:col-span-2">
                      <FieldLabel htmlFor="country">
                        {t("eventPage.country")}
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          id="country"
                          placeholder={t("eventPage.country")}
                          className={inputTone}
                          {...form.register("country")}
                        />
                        <FieldError
                          errors={errors.country ? [errors.country] : undefined}
                        />
                      </FieldContent>
                    </Field>
                  </FieldSet>
                </FieldSet>

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

      <Section
        title={t("eventPage.myEvents")}
        items={paginatedMyEvents}
        page={myPage}
        totalPages={myTotalPages}
        onPageChange={handleMyPageChange}
      />
      <Section
        title={t("eventPage.joinedEvents")}
        items={paginatedJoinedEvents}
        page={joinedPage}
        totalPages={joinedTotalPages}
        onPageChange={handleJoinedPageChange}
      />
      <Section
        title={t("eventPage.otherEvents")}
        items={paginatedOtherEvents}
        page={otherPage}
        totalPages={otherTotalPages}
        onPageChange={handleOtherPageChange}
      />
    </div>
  );
}
