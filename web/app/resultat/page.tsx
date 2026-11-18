import type { Metadata } from "next";
import { Suspense } from "react";
import ResultView from "@/components/ResultView";
import { copy } from "@/lib/copy";

export const metadata: Metadata = {
  title: copy.result.metaTitle,
};

export default function ResultPage({ searchParams }: PageProps<"/resultat">) {
  return (
    <Suspense
      fallback={
        <p role="status" className="rounded-[32px] bg-surface p-8 text-lg text-ink-soft md:p-12">
          {copy.result.loading}
        </p>
      }
    >
      <ResultView searchParams={searchParams} />
    </Suspense>
  );
}
