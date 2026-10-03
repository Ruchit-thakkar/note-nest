"use client";

import React, { useMemo } from "react";
import { marked } from "marked";

// Configure marked with GFM, line breaks, and smart formatting
marked.setOptions({
  gfm: true,
  breaks: true,
});

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const html = useMemo(() => {
    if (!content) return "";
    try {
      return marked.parse(content) as string;
    } catch (err) {
      console.error("Markdown parsing error:", err);
      return content;
    }
  }, [content]);

  return (
    <div
      className={`prose-ai text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
