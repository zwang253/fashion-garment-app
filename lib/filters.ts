import type { FilterOptions, FilterState, GarmentImage } from "./types.ts";

export const EMPTY_FILTERS: FilterState = {
  search: "",
  garmentType: "",
  style: "",
  material: "",
  color: "",
  pattern: "",
  occasion: "",
  consumerProfile: "",
  trendNote: "",
  continent: "",
  country: "",
  city: "",
  year: "",
  month: "",
  season: "",
  designer: "",
};

function uniqueSorted(values: Array<string | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])].sort((a, b) =>
    a.localeCompare(b),
  );
}

function getYear(dateString: string) {
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? "" : String(date.getUTCFullYear());
}

function getMonth(dateString: string) {
  const date = new Date(dateString);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
}

export function buildFilterOptions(images: GarmentImage[]): FilterOptions {
  return {
    garmentTypes: uniqueSorted(images.map((image) => image.attributes.garmentType)),
    styles: uniqueSorted(images.map((image) => image.attributes.style)),
    materials: uniqueSorted(images.map((image) => image.attributes.material)),
    colors: uniqueSorted(images.flatMap((image) => image.attributes.colorPalette)),
    patterns: uniqueSorted(images.map((image) => image.attributes.pattern)),
    occasions: uniqueSorted(images.flatMap((image) => image.attributes.occasion)),
    consumerProfiles: uniqueSorted(images.map((image) => image.attributes.consumerProfile)),
    trendNotes: uniqueSorted(images.flatMap((image) => image.attributes.trendNotes)),
    continents: uniqueSorted(images.map((image) => image.attributes.locationContext.continent)),
    countries: uniqueSorted(images.map((image) => image.attributes.locationContext.country)),
    cities: uniqueSorted(images.map((image) => image.attributes.locationContext.city)),
    years: uniqueSorted(images.map((image) => getYear(image.capturedAt))),
    months: uniqueSorted(images.map((image) => getMonth(image.capturedAt))),
    seasons: uniqueSorted(images.map((image) => image.attributes.season)),
    designers: uniqueSorted(images.map((image) => image.designer)),
  };
}

function matchesSearch(image: GarmentImage, search: string) {
  if (!search.trim()) {
    return true;
  }

  const haystack = [
    image.filename,
    image.aiDescription,
    image.designer,
    image.attributes.garmentType,
    image.attributes.style,
    image.attributes.material,
    image.attributes.pattern,
    image.attributes.season,
    image.attributes.consumerProfile,
    ...image.attributes.colorPalette,
    ...image.attributes.occasion,
    ...image.attributes.trendNotes,
    image.attributes.locationContext.continent,
    image.attributes.locationContext.country,
    image.attributes.locationContext.city,
    image.attributes.locationContext.venue,
    ...image.userAnnotations.map((annotation) => annotation.value),
  ]
    .join(" ")
    .toLowerCase();

  return search
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

function matchesSingle(actual: string, expected: string) {
  return !expected || actual === expected;
}

function matchesMany(actual: string[], expected: string) {
  return !expected || actual.includes(expected);
}

export function applyImageFilters(images: GarmentImage[], filters: Partial<FilterState>) {
  const merged = { ...EMPTY_FILTERS, ...filters };

  return images.filter((image) => {
    const year = getYear(image.capturedAt);
    const month = getMonth(image.capturedAt);

    return (
      matchesSearch(image, merged.search) &&
      matchesSingle(image.attributes.garmentType, merged.garmentType) &&
      matchesSingle(image.attributes.style, merged.style) &&
      matchesSingle(image.attributes.material, merged.material) &&
      matchesMany(image.attributes.colorPalette, merged.color) &&
      matchesSingle(image.attributes.pattern, merged.pattern) &&
      matchesMany(image.attributes.occasion, merged.occasion) &&
      matchesSingle(image.attributes.consumerProfile, merged.consumerProfile) &&
      matchesMany(image.attributes.trendNotes, merged.trendNote) &&
      matchesSingle(image.attributes.locationContext.continent, merged.continent) &&
      matchesSingle(image.attributes.locationContext.country, merged.country) &&
      matchesSingle(image.attributes.locationContext.city, merged.city) &&
      matchesSingle(year, merged.year) &&
      matchesSingle(month, merged.month) &&
      matchesSingle(image.attributes.season, merged.season) &&
      matchesSingle(image.designer, merged.designer)
    );
  });
}

export function filtersFromSearchParams(searchParams: URLSearchParams): FilterState {
  return {
    search: searchParams.get("search") || "",
    garmentType: searchParams.get("garmentType") || "",
    style: searchParams.get("style") || "",
    material: searchParams.get("material") || "",
    color: searchParams.get("color") || "",
    pattern: searchParams.get("pattern") || "",
    occasion: searchParams.get("occasion") || "",
    consumerProfile: searchParams.get("consumerProfile") || "",
    trendNote: searchParams.get("trendNote") || "",
    continent: searchParams.get("continent") || "",
    country: searchParams.get("country") || "",
    city: searchParams.get("city") || "",
    year: searchParams.get("year") || "",
    month: searchParams.get("month") || "",
    season: searchParams.get("season") || "",
    designer: searchParams.get("designer") || "",
  };
}
