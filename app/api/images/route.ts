import { NextRequest, NextResponse } from "next/server.js";

import { applyImageFilters, buildFilterOptions, filtersFromSearchParams } from "../../../lib/filters.ts";
import { listImages } from "../../../lib/repository.ts";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const images = await listImages();
    const filters = filtersFromSearchParams(new URL(request.url).searchParams);
    const filteredImages = applyImageFilters(images, filters);

    return NextResponse.json({
      images: filteredImages,
      filters,
      filterOptions: buildFilterOptions(images),
    });
  } catch (error) {
    console.error("Failed to fetch images", error);
    return NextResponse.json({ error: "Unable to load the image library." }, { status: 500 });
  }
}
