export type CourseLesson = {
  id: number;
  position: number;
  title: string;
  duration_label: string | null;
  objective: string | null;
  has_video: boolean;
  original_filename: string | null;
  completed: boolean;
};

export type CourseModule = {
  id: number;
  position: number;
  number: string;
  title: string;
  goal: string | null;
  lessons: CourseLesson[];
};

export type CourseDetail = {
  id: number;
  code: string;
  title: string;
  description: string | null;
  is_published: boolean;
  modules: CourseModule[];
};

export type CourseListItem = {
  id: number;
  code: string;
  title: string;
  description: string | null;
  is_published: boolean;
  module_count: number;
  lesson_count: number;
  videos_ready: number;
};
