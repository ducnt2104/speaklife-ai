"use client";

import React, { useMemo } from "react";
import { tokenizeScientificText } from "@/lib/render/scientific-renderer";
// KaTeX CSS — loaded only when MathText is used (removed from globals.css)
import "katex/dist/katex.min.css";

export interface MathTextProps {
  text: string;
  className?: string;
  inline?: boolean;
}

/**
 * Universal Scientific & Mathematical Text Component
 * Accurately renders mixed Vietnamese text, Markdown, and LaTeX equations ($...$, $$...$$, \(...\), \[...\])
 * Eliminates "$to$" bugs, renders arrows, formulas, chemical equations & fractions cleanly.
 */
export const MathText: React.FC<MathTextProps> = React.memo(({
  text,
  className = "",
  inline = false,
}) => {
  const tokens = useMemo(() => {
    return tokenizeScientificText(text);
  }, [text]);

  if (!text) return null;

  const Tag = inline ? "span" : "div";

  return (
    <Tag className={`math-text-container ${className}`}>
      {tokens.map((token, idx) => {
        if (token.type === "text") {
          return <span key={idx}>{token.content}</span>;
        }

        if (token.type === "inline_math") {
          return (
            <span
              key={idx}
              className="inline-math px-0.5"
              dangerouslySetInnerHTML={{ __html: token.renderedHtml || token.content }}
            />
          );
        }

        if (token.type === "block_math") {
          return (
            <div
              key={idx}
              className="block-math my-2.5 overflow-x-auto text-center py-1 max-w-full"
              dangerouslySetInnerHTML={{ __html: token.renderedHtml || token.content }}
            />
          );
        }

        return null;
      })}
    </Tag>
  );
});

MathText.displayName = "MathText";
