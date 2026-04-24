"use client";

import { startTransition, useDeferredValue, useState } from "react";

import { applyImageFilters, buildFilterOptions, EMPTY_FILTERS } from "../lib/filters.ts";
import type { FilterState, GarmentImage } from "../lib/types.ts";

type DashboardProps = {
  initialImages: GarmentImage[];
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}

export default function Dashboard({ initialImages }: DashboardProps) {
  const [images, setImages] = useState(initialImages);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [annotationState, setAnnotationState] = useState<Record<number, { note: string; tags: string }>>({});

  const deferredSearch = useDeferredValue(filters.search);
  const visibleImages = applyImageFilters(images, { ...filters, search: deferredSearch });
  const filterOptions = buildFilterOptions(images);

  async function refreshLibrary() {
    const response = await fetch("/api/images", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Unable to refresh library");
    }

    const payload = (await response.json()) as { images: GarmentImage[] };
    startTransition(() => {
      setImages(payload.images);
    });
  }

  async function handleUpload(formData: FormData) {
    setIsUploading(true);
    setStatus("Uploading and classifying...");

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Upload failed");
      }

      await refreshLibrary();
      setStatus("Image classified and added to the library.");
    } catch (error) {
      setStatus(getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleAnnotation(imageId: number) {
    const draft = annotationState[imageId];
    if (!draft?.note.trim() && !draft?.tags.trim()) {
      setStatus("Add at least one note or tag before saving.");
      return;
    }

    setStatus("Saving designer annotation...");

    try {
      const response = await fetch(`/api/images/${imageId}/annotations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Annotation save failed");
      }

      await refreshLibrary();
      setAnnotationState((current) => ({
        ...current,
        [imageId]: { note: "", tags: "" },
      }));
      setStatus("Annotation saved.");
    } catch (error) {
      setStatus(getErrorMessage(error));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-6 rounded-[2rem] border border-stone-200/80 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(33,24,15,0.45)] lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">Fashion Inspiration Index</p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
            Organize field imagery into a searchable design memory.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-stone-600">
            Upload reference photos, generate structured garment metadata, filter by product and context, then layer in
            designer insight over time.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-stone-600">
            <span className="rounded-full bg-stone-100 px-4 py-2">{images.length} looks indexed</span>
            <span className="rounded-full bg-stone-100 px-4 py-2">{filterOptions.designers.length} designers tracked</span>
            <span className="rounded-full bg-stone-100 px-4 py-2">{filterOptions.countries.length} countries represented</span>
          </div>
        </div>

        <form
          className="grid gap-3 rounded-[1.5rem] bg-[linear-gradient(135deg,#fff7ed_0%,#fef3c7_100%)] p-4"
          action={async (formData) => handleUpload(formData)}
        >
          <label className="grid gap-1 text-sm font-medium text-stone-700">
            Garment photo
            <input
              required
              name="image"
              type="file"
              accept="image/*"
              className="rounded-2xl border border-stone-300 bg-white px-3 py-3 text-sm"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              Designer
              <input name="designer" placeholder="Ava Chen" className="rounded-2xl border border-stone-300 bg-white px-3 py-2.5 text-sm" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              Captured at
              <input name="capturedAt" type="date" className="rounded-2xl border border-stone-300 bg-white px-3 py-2.5 text-sm" />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              Continent
              <input name="continent" placeholder="Asia" className="rounded-2xl border border-stone-300 bg-white px-3 py-2.5 text-sm" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              Country
              <input name="country" placeholder="Japan" className="rounded-2xl border border-stone-300 bg-white px-3 py-2.5 text-sm" />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              City
              <input name="city" placeholder="Tokyo" className="rounded-2xl border border-stone-300 bg-white px-3 py-2.5 text-sm" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              Venue
              <input name="venue" placeholder="Harajuku street market" className="rounded-2xl border border-stone-300 bg-white px-3 py-2.5 text-sm" />
            </label>
          </div>
          <button
            disabled={isUploading}
            className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-400"
            type="submit"
          >
            {isUploading ? "Processing..." : "Upload & classify"}
          </button>
          <p className="min-h-5 text-sm text-stone-600">{status}</p>
        </form>
      </section>

      <section className="rounded-[2rem] border border-stone-200/70 bg-white/90 p-5 shadow-[0_24px_80px_-56px_rgba(33,24,15,0.35)]">
        <div className="grid gap-3 lg:grid-cols-5">
          <label className="grid gap-1 text-sm font-medium text-stone-700 lg:col-span-2">
            Search
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="embroidered neckline artisan market"
              className="rounded-2xl border border-stone-300 bg-white px-3 py-2.5 text-sm"
            />
          </label>
          <SelectField label="Garment" value={filters.garmentType} options={filterOptions.garmentTypes} onChange={(value) => setFilters((current) => ({ ...current, garmentType: value }))} />
          <SelectField label="Country" value={filters.country} options={filterOptions.countries} onChange={(value) => setFilters((current) => ({ ...current, country: value }))} />
          <SelectField label="Season" value={filters.season} options={filterOptions.seasons} onChange={(value) => setFilters((current) => ({ ...current, season: value }))} />
          <SelectField label="Style" value={filters.style} options={filterOptions.styles} onChange={(value) => setFilters((current) => ({ ...current, style: value }))} />
          <SelectField label="Material" value={filters.material} options={filterOptions.materials} onChange={(value) => setFilters((current) => ({ ...current, material: value }))} />
          <SelectField label="Pattern" value={filters.pattern} options={filterOptions.patterns} onChange={(value) => setFilters((current) => ({ ...current, pattern: value }))} />
          <SelectField label="Designer" value={filters.designer} options={filterOptions.designers} onChange={(value) => setFilters((current) => ({ ...current, designer: value }))} />
          <SelectField label="Month" value={filters.month} options={filterOptions.months} onChange={(value) => setFilters((current) => ({ ...current, month: value }))} />
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibleImages.map((image) => (
          <article key={image.id} className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-[0_24px_60px_-48px_rgba(33,24,15,0.45)]">
            <div className="aspect-[4/5] overflow-hidden bg-stone-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.imageUrl} alt={image.filename} className="h-full w-full object-cover" />
            </div>
            <div className="space-y-4 p-5">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-stone-900">{image.filename}</h2>
                    <p className="text-sm text-stone-500">
                      {image.designer} · {image.attributes.locationContext.city}, {image.attributes.locationContext.country}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
                    {image.attributes.garmentType}
                  </span>
                </div>
                <p className="text-sm leading-6 text-stone-600">{image.aiDescription}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {[image.attributes.style, image.attributes.material, image.attributes.pattern, image.attributes.season, ...image.attributes.colorPalette].map((item) => (
                  <span key={`${image.id}-${item}`} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                    {item}
                  </span>
                ))}
              </div>

              <div className="rounded-2xl bg-stone-50 p-3 text-sm text-stone-600">
                <p>
                  <span className="font-semibold text-stone-900">Occasion:</span> {image.attributes.occasion.join(", ")}
                </p>
                <p>
                  <span className="font-semibold text-stone-900">Trend notes:</span> {image.attributes.trendNotes.join(", ")}
                </p>
                <p>
                  <span className="font-semibold text-stone-900">Captured:</span> {formatDate(image.capturedAt)}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">Designer annotations</p>
                <div className="flex flex-wrap gap-2">
                  {image.userAnnotations.length > 0 ? (
                    image.userAnnotations.map((annotation) => (
                      <span key={annotation.id} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                        {annotation.kind}: {annotation.value}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-stone-400">No designer notes yet.</span>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={annotationState[image.id]?.note || ""}
                  onChange={(event) =>
                    setAnnotationState((current) => ({
                      ...current,
                      [image.id]: { note: event.target.value, tags: current[image.id]?.tags || "" },
                    }))
                  }
                  placeholder="Add observations about proportion, trims, or commercial relevance."
                  className="w-full rounded-2xl border border-stone-300 bg-white px-3 py-2.5 text-sm"
                />
                <input
                  value={annotationState[image.id]?.tags || ""}
                  onChange={(event) =>
                    setAnnotationState((current) => ({
                      ...current,
                      [image.id]: { note: current[image.id]?.note || "", tags: event.target.value },
                    }))
                  }
                  placeholder="Tags, comma separated"
                  className="w-full rounded-2xl border border-stone-300 bg-white px-3 py-2.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleAnnotation(image.id)}
                  className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 transition hover:border-stone-900 hover:bg-stone-900 hover:text-white"
                >
                  Save annotation
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {visibleImages.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-stone-300 bg-white/70 p-10 text-center text-stone-500">
          No looks match the current filters yet. Try broadening the search or uploading a new reference image.
        </section>
      ) : null}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-stone-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-stone-300 bg-white px-3 py-2.5 text-sm"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={`${label}-${option}`} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
