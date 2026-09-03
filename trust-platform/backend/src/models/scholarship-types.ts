// Scholarship types for Neelakannu Educational Trust Platform

export enum EducationLevel {
  HIGH_SCHOOL = "high_school",
  DIPLOMA = "diploma",
  UNDERGRADUATE = "undergraduate",
  POSTGRADUATE = "postgraduate",
}

export interface DocumentConfig {
  id: string;
  name: string;
  description?: string;
  maxFileSize: number;
  allowedTypes: string[];
  isRequired: boolean;
}