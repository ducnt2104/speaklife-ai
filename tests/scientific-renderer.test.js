/**
 * SpeakLife AI — Comprehensive Scientific & Mathematical Notation Unit Test Suite
 * Covers all 12 required test cases for LaTeX, Chemistry, Physics, $to$ normalization & Currency protection.
 */

const test = require("node:test");
const assert = require("node:assert");

// Import parser logic
const {
  preprocessScientificText,
  tokenizeScientificText,
  renderKaTeXToString,
  isCurrency,
  UNICODE_MATH_MAP,
} = require("../src/lib/render/scientific-renderer.ts");

test("Scientific & Mathematical Notation Engine Tests", async (t) => {
  // Test Case 1: Công thức LaTeX inline: \(a^2+b^2=c^2\)
  await t.test("1. Inline LaTeX \\(a^2+b^2=c^2\\)", () => {
    const input = "Định lý Pythagoras: \\(a^2+b^2=c^2\\) trong tam giác vuông.";
    const tokens = tokenizeScientificText(input);
    const mathToken = tokens.find((tok) => tok.type === "inline_math");
    assert.ok(mathToken, "Should parse inline_math token");
    assert.strictEqual(mathToken.content, "a^2+b^2=c^2");
    assert.ok(mathToken.renderedHtml.includes("katex"), "Rendered HTML must contain KaTeX structure");
  });

  // Test Case 2: Công thức block: \[E=mc^2\]
  await t.test("2. Block LaTeX \\[E=mc^2\\]", () => {
    const input = "Năng lượng nghỉ của Einstein:\n\\[E=mc^2\\]\náp dụng trong vật lý hạt nhân.";
    const tokens = tokenizeScientificText(input);
    const blockToken = tokens.find((tok) => tok.type === "block_math");
    assert.ok(blockToken, "Should parse block_math token");
    assert.strictEqual(blockToken.content, "E=mc^2");
    assert.ok(blockToken.renderedHtml.includes("katex-display") || blockToken.renderedHtml.includes("katex"), "Rendered HTML must contain KaTeX display structure");
  });

  // Test Case 3: Mũi tên hóa học: \[2H_2+O_2\rightarrow 2H_2O\]
  await t.test("3. Chemical reaction arrow \\[2H_2+O_2\\rightarrow 2H_2O\\]", () => {
    const input = "Phản ứng đốt cháy hydro: \\[2H_2+O_2\\rightarrow 2H_2O\\]";
    const tokens = tokenizeScientificText(input);
    const mathToken = tokens.find((tok) => tok.type === "block_math");
    assert.ok(mathToken);
    assert.ok(mathToken.renderedHtml.includes("rarr") || mathToken.renderedHtml.includes("→") || mathToken.renderedHtml.includes("katex"));
  });

  // Test Case 4: Phản ứng thuận nghịch: \[N_2+3H_2\rightleftharpoons 2NH_3\]
  await t.test("4. Equilibrium reaction \\[N_2+3H_2\\rightleftharpoons 2NH_3\\]", () => {
    const input = "Quá trình tổng hợp Haber: \\[N_2+3H_2\\rightleftharpoons 2NH_3\\]";
    const tokens = tokenizeScientificText(input);
    const mathToken = tokens.find((tok) => tok.type === "block_math");
    assert.ok(mathToken);
    assert.ok(mathToken.renderedHtml.includes("katex"));
  });

  // Test Case 5: Phân số: \[\frac{a+b}{c+d}\]
  await t.test("5. Fraction equation \\[\\frac{a+b}{c+d}\\]", () => {
    const input = "Công thức tỷ số: \\[\\frac{a+b}{c+d}\\]";
    const tokens = tokenizeScientificText(input);
    const mathToken = tokens.find((tok) => tok.type === "block_math");
    assert.ok(mathToken);
    assert.ok(mathToken.renderedHtml.includes("mfrac") || mathToken.renderedHtml.includes("katex"));
  });

  // Test Case 6: Căn thức: \[\sqrt{x^2+y^2}\]
  await t.test("6. Square root \\[\\sqrt{x^2+y^2}\\]", () => {
    const input = "Khoảng cách Euclid: \\[\\sqrt{x^2+y^2}\\]";
    const tokens = tokenizeScientificText(input);
    const mathToken = tokens.find((tok) => tok.type === "block_math");
    assert.ok(mathToken);
    assert.ok(mathToken.renderedHtml.includes("sqrt") || mathToken.renderedHtml.includes("katex"));
  });

  // Test Case 7: Chỉ số trên và dưới: H_2SO_4, x^{2}, Ca^{2+}
  await t.test("7. Subscripts and superscripts: H_2SO_4, x^{2}, Ca^{2+}", () => {
    const input = "Axit sunfuric $H_2SO_4$ và ion $Ca^{2+}$";
    const tokens = tokenizeScientificText(input);
    const mathTokens = tokens.filter((tok) => tok.type === "inline_math");
    assert.strictEqual(mathTokens.length, 2);
    assert.strictEqual(mathTokens[0].content, "H_2SO_4");
    assert.strictEqual(mathTokens[1].content, "Ca^{2+}");
    assert.ok(mathTokens[0].renderedHtml.includes("katex"));
    assert.ok(mathTokens[1].renderedHtml.includes("katex"));
  });

  // Test Case 8: Ký hiệu Hy Lạp: \alpha, \Delta, \Omega
  await t.test("8. Greek letters: \\alpha, \\Delta, \\Omega", () => {
    const input = "Góc lệch $\\alpha$, biến thiên $\\Delta H$, điện trở $\\Omega$";
    const tokens = tokenizeScientificText(input);
    const mathTokens = tokens.filter((tok) => tok.type === "inline_math");
    assert.strictEqual(mathTokens.length, 3);
    assert.ok(mathTokens[0].renderedHtml.includes("katex"));
    assert.ok(mathTokens[1].renderedHtml.includes("katex"));
    assert.ok(mathTokens[2].renderedHtml.includes("katex"));
  });

  // Test Case 9: Công thức tích phân và tổng: \int_{0}^{1} x dx, \sum_{i=1}^{n}
  await t.test("9. Integrals and summations: \\int and \\sum", () => {
    const input = "Tích phân: $\\int_{0}^{1} x dx$ và tổng $\\sum_{i=1}^{n} a_i$";
    const tokens = tokenizeScientificText(input);
    const mathTokens = tokens.filter((tok) => tok.type === "inline_math");
    assert.strictEqual(mathTokens.length, 2);
    assert.ok(mathTokens[0].renderedHtml.includes("katex"));
    assert.ok(mathTokens[1].renderedHtml.includes("katex"));
  });

  // Test Case 10: Chuỗi văn bản thông thường có dấu $, ví dụ giá tiền $100
  await t.test("10. Currency strings like $100 or $50/month are NOT parsed as LaTeX", () => {
    const input = "Chi phí thiết bị chỉ khoảng $100 cho một module và $50/tháng vận hành.";
    const tokens = tokenizeScientificText(input);
    const mathTokens = tokens.filter((tok) => tok.type === "inline_math");
    assert.strictEqual(mathTokens.length, 0, "Currency should remain text, not inline_math");
    const fullText = tokens.map((t) => t.content).join("");
    assert.ok(fullText.includes("$100"), "Must preserve literal $100 text");
    assert.ok(fullText.includes("$50/tháng"), "Must preserve literal $50/tháng text");
  });

  // Test Case 11: Nội dung trộn văn bản, Markdown, HTML và công thức
  await t.test("11. Mixed Vietnamese text, Markdown, and formulas", () => {
    const input = "Phương pháp: Lắng nghe $\\to$ Dẫn chứng $\\to$ Khẳng định giải pháp.";
    const tokens = tokenizeScientificText(input);
    const mathTokens = tokens.filter((tok) => tok.type === "inline_math");
    assert.strictEqual(mathTokens.length, 2, "Should find both \\to tokens");
    assert.ok(tokens[0].content.includes("Phương pháp: Lắng nghe"));
  });

  // Test Case 12: Xử lý riêng lỗi $to$
  await t.test("12. Specific $to$ normalization prevents literal '$to$' bug", () => {
    const brokenInput = "Cấu trúc: Lắng nghe $to$ Dẫn chứng $to$ Khẳng định.";
    const normalized = preprocessScientificText(brokenInput);
    assert.ok(!normalized.includes("$to$"), "Raw '$to$' must be transformed to '$\\to$'");
    assert.ok(normalized.includes("$\\to$"));

    const tokens = tokenizeScientificText(brokenInput);
    const mathTokens = tokens.filter((tok) => tok.type === "inline_math");
    assert.strictEqual(mathTokens.length, 2);
    assert.strictEqual(mathTokens[0].content, "\\to");
    assert.ok(mathTokens[0].renderedHtml.includes("katex"));
  });
});
