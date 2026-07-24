export type { Source, SourceBrief } from "@/types/api";

export type SourceFormData = {
  code: string;
  name: string;
  description: string;
  sort_order: number;
};

export const EMPTY_SOURCE_FORM: SourceFormData = {
  code: "",
  name: "",
  description: "",
  sort_order: 0,
};
