export const formatDateRange = (startDate: string, endDate: string) => {
  const formatter = new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `${formatter.format(new Date(startDate))} – ${formatter.format(new Date(endDate))}`;
};
