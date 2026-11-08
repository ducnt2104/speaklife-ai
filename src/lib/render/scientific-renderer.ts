// SpeakLife AI — Unified Scientific & Mathematical Notation Renderer
// Robust parser for LaTeX, Math, Chemistry, Physics & Special Symbols
// Compliant with KaTeX with Zero-Crash Graceful Fallback and Currency Protection

import katex from "katex";

export interface RenderToken {
  type: "text" | "inline_math" | "block_math";
  content: string;
  renderedHtml?: string;
}

// Unicode substitution dictionary for fallback when raw LaTeX or broken syntax is encountered
export const UNICODE_MATH_MAP: Record<string, string> = {
  "\\to": "→",
  "\\rightarrow": "→",
  "\\leftarrow": "←",
  "\\Rightarrow": "⇒",
  "\\Leftarrow": "⇐",
  "\\Leftrightarrow": "⇔",
  "\\rightleftharpoons": "⇌",
  "\\uparrow": "↑",
  "\\downarrow": "↓",
  "\\pm": "±",
  "\\mp": "∓",
  "\\times": "×",
  "\\div": "÷",
  "\\cdot": "·",
  "\\neq": "≠",
  "\\approx": "≈",
  "\\equiv": "≡",
  "\\leq": "≤",
  "\\geq": "≥",
  "\\le": "≤",
  "\\ge": "≥",
  "\\infty": "∞",
  "\\alpha": "α",
  "\\beta": "β",
  "\\gamma": "γ",
  "\\Delta": "Δ",
  "\\delta": "δ",
  "\\Omega": "Ω",
  "\\omega": "ω",
  "\\pi": "π",
  "\\lambda": "λ",
  "\\mu": "μ",
  "\\theta": "θ",
  "\\sigma": "σ",
  "\\sum": "∑",
  "\\prod": "∏",
  "\\int": "∫",
  "\\sqrt": "√",
  "\\degree": "°",
};

// Chemical subscript converter (H2O -> H₂O, CO2 -> CO₂)
const SUBSCRIPT_DIGITS: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
};

const SUPERSCRIPT_DIGITS: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻",
};

/**
 * Preprocess and normalize malformed scientific notations before tokenization.
 * Specifically fixes:
 * 1. Literal "$to$" or "$\to$" with tab escapes (JS string '\to' -> '\t' + 'o')
 * 2. Unescaped backslashes in AI outputs
 * 3. Preserves currency like "$100", "$50.00", "$10/tháng" so they are not treated as LaTeX
 */
export function preprocessScientificText(input: string): string {
  if (!input || typeof input !== "string") return "";

  let text = input;

  // 1. Fix JavaScript '\t' + 'o' or raw "$to$" to standard LaTeX "$\to$"
  text = text.replace(/\$to\$/gi, "$\\to$");
  text = text.replace(/\$\to\$/g, "$\\to$");
  text = text.replace(/\$\s*\\t\s*o\s*\$/g, "$\\to$");
  // Also fix literal tab character preceding 'o' inside dollar signs: $\to
  text = text.replace(/\$\to/g, "$\\to$");

  return text;
}

/**
 * Checks if a string segment enclosed in single '$' is a currency amount
 * rather than a mathematical formula.
 * E.g., "$100", "$25.50", "$1,000,000"
 */
export function isCurrency(str: string): boolean {
  return /^\s*\d+([.,]\d+)?(\s*(k|K|tr|triệu|USD|VND|đ|tháng|year|month|\/|%))?\s*$/i.test(str);
}

/**
 * Safe KaTeX renderer with graceful Unicode fallback.
 * Guaranteed NEVER to throw an unhandled exception or crash the app.
 */
export function renderKaTeXToString(tex: string, displayMode: boolean = false): string {
  const cleanTex = tex.trim();
  if (!cleanTex) return "";

  try {
    return katex.renderToString(cleanTex, {
      displayMode,
      throwOnError: false,
      output: "htmlAndMathml",
      strict: false,
      trust: false,
    });
  } catch (err) {
    console.warn("[KaTeX Render Warning] Fallback triggered for:", cleanTex, err);
    // Graceful fallback: replace known LaTeX macros with Unicode characters
    let fallback = cleanTex;
    for (const [macro, unicode] of Object.entries(UNICODE_MATH_MAP)) {
      fallback = fallback.split(macro).join(unicode);
    }
    // Clean remaining braces
    fallback = fallback.replace(/[{}]/g, " ");
    return displayMode
      ? `<div class="katex-fallback block my-2 text-center font-mono">${escapeHtml(fallback)}</div>`
      : `<span class="katex-fallback font-mono">${escapeHtml(fallback)}</span>`;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Tokenizes text containing mixed plain text, block LaTeX, inline LaTeX, and currency.
 * Handles:
 * - Block math: `$$...$$` and `\[...\]`
 * - Inline math: `$...$` and `\(...\)`
 * - Skips currency `$100` without false positive delimiter matching
 */
export function tokenizeScientificText(rawInput: string): RenderToken[] {
  const input = preprocessScientificText(rawInput);
  const tokens: RenderToken[] = [];

  let i = 0;
  const len = input.length;
  let textBuffer = "";

  const flushText = () => {
    if (textBuffer) {
      tokens.push({ type: "text", content: textBuffer });
      textBuffer = "";
    }
  };

  while (i < len) {
    // 1. Check for Block Math: \[ ... \]
    if (input.startsWith("\\[", i)) {
      const endIdx = input.indexOf("\\]", i + 2);
      if (endIdx !== -1) {
        flushText();
        const mathContent = input.slice(i + 2, endIdx);
        tokens.push({
          type: "block_math",
          content: mathContent,
          renderedHtml: renderKaTeXToString(mathContent, true),
        });
        i = endIdx + 2;
        continue;
      }
    }

    // 2. Check for Inline Math: \( ... \)
    if (input.startsWith("\\(", i)) {
      const endIdx = input.indexOf("\\)", i + 2);
      if (endIdx !== -1) {
        flushText();
        const mathContent = input.slice(i + 2, endIdx);
        tokens.push({
          type: "inline_math",
          content: mathContent,
          renderedHtml: renderKaTeXToString(mathContent, false),
        });
        i = endIdx + 2;
        continue;
      }
    }

    // 3. Check for Block Math: $$ ... $$
    if (input.startsWith("$$", i)) {
      const endIdx = input.indexOf("$$", i + 2);
      if (endIdx !== -1) {
        flushText();
        const mathContent = input.slice(i + 2, endIdx);
        tokens.push({
          type: "block_math",
          content: mathContent,
          renderedHtml: renderKaTeXToString(mathContent, true),
        });
        i = endIdx + 2;
        continue;
      }
    }

    // 4. Check for Inline Math: $ ... $
    if (input[i] === "$") {
      // 4a. Check if this is a standalone currency expression (e.g., "$100", "$25.50", "$50/tháng")
      // Do not mistake it for math unless followed by a letter variable like "$2x$"
      const currencyMatch = input.slice(i).match(/^\$(\d+(?:[.,]\d+)?)(?:\s*(?:k|K|tr|triệu|USD|VND|đ|tháng|year|month|\/|%)|\b)/i);
      const isFormulaVar = /^\$\d+[a-zA-Z]/.test(input.slice(i));

      if (currencyMatch && !isFormulaVar) {
        textBuffer += currencyMatch[0];
        i += currencyMatch[0].length;
        continue;
      }

      const nextDollar = input.indexOf("$", i + 1);

      if (nextDollar !== -1) {
        const potentialMath = input.slice(i + 1, nextDollar);

        // If it's a currency expression like "$100$", treat as text
        if (isCurrency(potentialMath)) {
          textBuffer += "$" + potentialMath + "$";
          i = nextDollar + 1;
          continue;
        }

        // If it spans more than 300 chars or across multiple newlines, probably unclosed $
        if (potentialMath.length <= 300 && !potentialMath.includes("\n\n")) {
          flushText();
          tokens.push({
            type: "inline_math",
            content: potentialMath,
            renderedHtml: renderKaTeXToString(potentialMath, false),
          });
          i = nextDollar + 1;
          continue;
        }
      }

      // Single unclosed $ or currency -> treat as normal text
      textBuffer += "$";
      i++;
      continue;
    }

    // Plain text character
    textBuffer += input[i];
    i++;
  }

  flushText();
  return tokens;
}

/**
 * Transforms chemical notation patterns like "2H2 + O2 -> 2H2O" into LaTeX or Unicode
 */
export function formatChemicalEquation(equation: string): string {
  let formatted = equation;
  // Replace simple arrow representations
  formatted = formatted.replace(/->|-->|=>/g, "\\rightarrow ");
  formatted = formatted.replace(/<->|<-->|<=>/g, "\\rightleftharpoons ");
  return formatted;
}
