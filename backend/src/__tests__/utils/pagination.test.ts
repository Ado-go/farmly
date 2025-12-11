import {
  buildPaginationResponse,
  getPaginationParams,
} from "../../utils/pagination.ts";

describe("getPaginationParams", () => {
  it("returns defaults when query is empty", () => {
    const params = getPaginationParams({});

    expect(params).toEqual({
      page: 1,
      pageSize: 32,
      skip: 0,
      take: 32,
    });
  });

  it("parses page and limit and respects max page size", () => {
    const params = getPaginationParams({ page: "3", limit: "10" }, 20, 50);

    expect(params).toEqual({
      page: 3,
      pageSize: 10,
      skip: 20,
      take: 10,
    });
  });

  it("falls back for invalid numbers and caps to max", () => {
    const params = getPaginationParams({ page: "-2", limit: "120.9" }, 15, 50);

    expect(params.page).toBe(1);
    expect(params.pageSize).toBe(50);
    expect(params.skip).toBe(0);
    expect(params.take).toBe(50);
  });

  it("uses default page size when zero or NaN are provided", () => {
    const params = getPaginationParams({ page: "abc", pageSize: "0" }, 25, 30);

    expect(params).toEqual({
      page: 1,
      pageSize: 25,
      skip: 0,
      take: 25,
    });
  });
});

describe("buildPaginationResponse", () => {
  it("builds metadata with hasMore flag", () => {
    const result = buildPaginationResponse(["a", "b"], 2, 5, 12);

    expect(result).toEqual({
      items: ["a", "b"],
      page: 2,
      pageSize: 5,
      total: 12,
      totalPages: 3,
      hasMore: true,
    });
  });

  it("handles zero page size safely", () => {
    const result = buildPaginationResponse([], 1, 0, 0);

    expect(result.totalPages).toBe(0);
    expect(result.hasMore).toBe(false);
  });
});
