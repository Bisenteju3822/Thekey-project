"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useCourses } from "@/hooks/use-posts";
import { useTranslation } from "@/app/providers";

export default function CoursesPage() {
  const { t } = useTranslation();
  const { data: courses, isLoading, error } = useCourses();

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{t("courses.title")}</h1>

        {isLoading && (
          <p className="text-gray-500 text-center py-12">{t("common.loading")}</p>
        )}

        {error && (
          <p className="text-red-500 text-center py-12">{t("common.error")}</p>
        )}

        {courses && courses.length === 0 && (
          <p className="text-gray-400 text-center py-12">No courses found.</p>
        )}

        <div className="space-y-4">
          {courses?.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md hover:border-indigo-300 transition-all"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                {course.title}
              </h2>
              <p className="text-sm text-gray-500 mb-3">{course.description}</p>
              <span className="text-sm text-indigo-600 font-medium">
                {t("courses.viewFeed")} &rarr;
              </span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
