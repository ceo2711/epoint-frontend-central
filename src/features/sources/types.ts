export type { Source, SourceBrief } from "@/types/api";

export type SourceFormData = {
  code: string;
  name: string;
  description: string;
};

export const EMPTY_SOURCE_FORM: SourceFormData = {
  code: "",
  name: "",
  description: "",
};
