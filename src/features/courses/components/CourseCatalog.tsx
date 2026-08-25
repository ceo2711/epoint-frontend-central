"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useTranslation } from "@/contexts/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import type { CourseDetail, CourseLesson } from "@/features/courses/types";
import { api } from "@/lib/api";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

type Mode = "watch" | "manage";

export function CourseCatalog({ mode }: { mode: Mode }) {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openModuleId, setOpenModuleId] = useState<number | null>(null);
  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [busyLessonId, setBusyLessonId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingUploadId = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      if (mode === "watch") {
        const data = await api.get<CourseDetail>("/portal/courses", token);
        setCourse(data);
        setOpenModuleId((current) => current ?? data.modules[0]?.id ?? null);
        return;
      }
      const list = await api.get<{ id: number }[]>("/courses", token);
      const first = list[0];
      if (!first) {
        setCourse(null);
        return;
      }
      const data = await api.get<CourseDetail>(`/courses/${first.id}`, token);
      setCourse(data);
      setOpenModuleId((current) => current ?? data.modules[0]?.id ?? null);
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("courses.loadError")));
    } finally {
      setLoading(false);
    }
  }, [mode, t, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    if (!course) return { lessons: 0, videos: 0, done: 0 };
    const lessons = course.modules.flatMap((module) => module.lessons);
    return {
      lessons: lessons.length,
      videos: lessons.filter((lesson) => lesson.has_video).length,
      done: lessons.filter((lesson) => lesson.completed).length,
    };
  }, [course]);

  async function selectLesson(lesson: CourseLesson) {
    setActiveLesson(lesson);
    setPlayUrl(null);
    if (!lesson.has_video || !token) return;
    try {
      const path =
        mode === "watch"
          ? `/portal/courses/lessons/${lesson.id}/play`
          : `/courses/lessons/${lesson.id}/play`;
      const data = await api.get<{ play_url: string }>(path, token);
      setPlayUrl(data.play_url);
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("courses.playError")));
    }
  }

  async function onEnded() {
    if (mode !== "watch" || !token || !activeLesson) return;
    try {
      await api.post(`/portal/courses/lessons/${activeLesson.id}/complete`, {}, token);
      setCourse((current) => {
        if (!current) return current;
        return {
          ...current,
          modules: current.modules.map((module) => ({
            ...module,
            lessons: module.lessons.map((lesson) =>
              lesson.id === activeLesson.id ? { ...lesson, completed: true } : lesson,
            ),
          })),
        };
      });
    } catch {
      /* el video igual se vio */
    }
  }

  function pickFile(lessonId: number) {
    pendingUploadId.current = lessonId;
    inputRef.current?.click();
  }

  async function onFile(file: File | undefined) {
    const lessonId = pendingUploadId.current;
    pendingUploadId.current = null;
    if (!file || !lessonId || !token) return;
    setBusyLessonId(lessonId);
    setError("");
    try {
      const signed = await api.post<{
        upload_url: string;
        storage_key: string;
        content_type: string;
      }>(
        `/courses/lessons/${lessonId}/upload-url`,
        { filename: file.name, content_type: file.type || "video/mp4" },
        token,
      );
      const put = await fetch(signed.upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": signed.content_type },
      });
      if (!put.ok) {
        throw new Error(t("courses.uploadCors"));
      }
      await api.post(
        `/courses/lessons/${lessonId}/confirm`,
        {
          storage_key: signed.storage_key,
          original_filename: file.name,
          mime_type: signed.content_type,
        },
        token,
      );
      await load();
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("courses.uploadError")));
    } finally {
      setBusyLessonId(null);
    }
  }

  async function removeVideo(lessonId: number) {
    if (!token) return;
    setBusyLessonId(lessonId);
    try {
      await api.delete(`/courses/lessons/${lessonId}/video`, token);
      if (activeLesson?.id === lessonId) {
        setActiveLesson(null);
        setPlayUrl(null);
      }
      await load();
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("courses.uploadError")));
    } finally {
      setBusyLessonId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner label={t("courses.loading")} />
      </div>
    );
  }

  if (!course) {
    return <p className="text-slate-600">{error || t("courses.empty")}</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4"
        className="hidden"
        onChange={(event) => void onFile(event.target.files?.[0])}
      />
      <div className="space-y-4">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-900">{course.title}</h2>
          {course.description ? <p className="mt-1 text-sm text-slate-600">{course.description}</p> : null}
          <p className="mt-3 text-sm text-slate-500">
            {mode === "watch"
              ? t("courses.progress", { done: String(stats.done), total: String(stats.lessons) })
              : t("courses.videosReady", { ready: String(stats.videos), total: String(stats.lessons) })}
          </p>
        </Card>
        <div className="space-y-2">
          {course.modules.map((module) => {
            const open = openModuleId === module.id;
            return (
              <Card key={module.id} className="overflow-hidden p-0">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
                  onClick={() => setOpenModuleId(open ? null : module.id)}
                >
                  <span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-brand">
                      {t("courses.module")} {module.number}
                    </span>
                    <span className="mt-0.5 block font-medium text-slate-900">{module.title}</span>
                  </span>
                  <span className="text-slate-400">{open ? "−" : "+"}</span>
                </button>
                {open ? (
                  <div className="border-t border-slate-100 px-4 pb-3">
                    {module.goal ? <p className="py-2 text-sm text-slate-600">{module.goal}</p> : null}
                    <ul className="space-y-1">
                      {module.lessons.map((lesson) => {
                        const selected = activeLesson?.id === lesson.id;
                        return (
                          <li key={lesson.id}>
                            <button
                              type="button"
                              className={`flex w-full items-start justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm ${
                                selected ? "bg-brand-muted text-slate-900" : "hover:bg-slate-50"
                              }`}
                              onClick={() => void selectLesson(lesson)}
                            >
                              <span>
                                <span className="font-medium">{lesson.title}</span>
                                <span className="mt-0.5 block text-xs text-slate-500">
                                  {lesson.duration_label}
                                  {lesson.completed ? ` · ${t("courses.completed")}` : ""}
                                  {!lesson.has_video ? ` · ${t("courses.noVideo")}` : ""}
                                </span>
                              </span>
                            </button>
                            {mode === "manage" ? (
                              <div className="mb-2 flex flex-wrap gap-2 px-2">
                                <Button
                                  size="xs"
                                  variant="secondary"
                                  disabled={busyLessonId === lesson.id}
                                  onClick={() => pickFile(lesson.id)}
                                >
                                  {busyLessonId === lesson.id ? t("courses.uploading") : t("courses.uploadMp4")}
                                </Button>
                                {lesson.has_video ? (
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    disabled={busyLessonId === lesson.id}
                                    onClick={() => void removeVideo(lesson.id)}
                                  >
                                    {t("courses.removeVideo")}
                                  </Button>
                                ) : null}
                                {lesson.original_filename ? (
                                  <span className="self-center text-xs text-slate-500">
                                    {lesson.original_filename}
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      </div>
      <Card className="p-5">
        {activeLesson ? (
          <>
            <h3 className="text-lg font-semibold text-slate-900">{activeLesson.title}</h3>
            {activeLesson.objective ? (
              <p className="mt-2 text-sm text-slate-600">{activeLesson.objective}</p>
            ) : null}
            <div className="mt-4 overflow-hidden rounded-xl bg-black">
              {playUrl ? (
                <video
                  key={playUrl}
                  className="aspect-video w-full"
                  controls
                  src={playUrl}
                  onEnded={() => void onEnded()}
                />
              ) : (
                <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-white/80">
                  {activeLesson.has_video ? t("courses.loading") : t("courses.comingSoon")}
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-slate-600">{t("courses.pickLesson")}</p>
        )}
      </Card>
    </div>
  );
}
