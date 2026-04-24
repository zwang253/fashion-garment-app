export type Annotation = {
  id: string;
  kind: "tag" | "note";
  value: string;
  createdAt: string;
};

export type StructuredAttributes = {
  garmentType: string;
  style: string;
  material: string;
  colorPalette: string[];
  pattern: string;
  season: string;
  occasion: string[];
  consumerProfile: string;
  trendNotes: string[];
  locationContext: {
    continent: string;
    country: string;
    city: string;
    venue: string;
  };
};

export type GarmentImage = {
  id: number;
  filename: string;
  imageUrl: string;
  aiDescription: string;
  attributes: StructuredAttributes;
  userAnnotations: Annotation[];
  designer: string;
  capturedAt: string;
  createdAt: string;
};

export type UploadContext = {
  designer?: string;
  continent?: string;
  country?: string;
  city?: string;
  venue?: string;
  capturedAt?: string;
};

export type FilterState = {
  search: string;
  garmentType: string;
  style: string;
  material: string;
  color: string;
  pattern: string;
  occasion: string;
  consumerProfile: string;
  trendNote: string;
  continent: string;
  country: string;
  city: string;
  year: string;
  month: string;
  season: string;
  designer: string;
};

export type FilterOptions = {
  garmentTypes: string[];
  styles: string[];
  materials: string[];
  colors: string[];
  patterns: string[];
  occasions: string[];
  consumerProfiles: string[];
  trendNotes: string[];
  continents: string[];
  countries: string[];
  cities: string[];
  years: string[];
  months: string[];
  seasons: string[];
  designers: string[];
};

export type ClassifierOutput = {
  description: string;
  attributes: StructuredAttributes;
};
