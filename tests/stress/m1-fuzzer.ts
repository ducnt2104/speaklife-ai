/**
 * SpeakLife AI — Milestone 1 Adversarial Fuzzing & Stress Harness
 * Empirical Challenger: Challenger 1 (Boundary & Input Fuzzing)
 * 
 * Verifies:
 * 1. formatTime fuzzing (edge cases, non-finite, floats, massive durations, random fuzzing)
 * 2. cn() fuzzing (falsy, nested arrays, object flags, Tailwind conflicts, high-volume permutations)
 * 3. clamp() boundary stress (min/max bounds, inverted intervals, non-finite floats, random fuzzing)
 * 4. formatPercentage() fuzzing (ratios, edge boundaries, negatives)
 * 5. UI components import and render crash-resilience across all variants, sizes, and states
 */

import React from "react";
import { renderToString } from "react-dom/server";
import { formatTime, cn, clamp, formatPercentage } from "../../src/lib/utils";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Progress,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Alert,
  AlertTitle,
  AlertDescription,
  EdgeStateAlert,
  Navbar,
} from "../../src/components/ui";

interface TestTelemetry {
  category: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  error?: string;
  durationMs: number;
}

const telemetryLog: TestTelemetry[] = [];
let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function runEmpiricalCheck(
  category: string,
  name: string,
  fn: () => { pass: boolean; actual?: any; expected?: any; error?: string }
) {
  const start = performance.now();
  totalAssertions++;
  let res: { pass: boolean; actual?: any; expected?: any; error?: string };
  try {
    res = fn();
  } catch (err: any) {
    res = { pass: false, error: err.message || String(err) };
  }
  const durationMs = performance.now() - start;

  if (res.pass) {
    passedAssertions++;
    telemetryLog.push({ category, name, passed: true, actual: res.actual, expected: res.expected, durationMs });
  } else {
    failedAssertions++;
    telemetryLog.push({
      category,
      name,
      passed: false,
      actual: res.actual,
      expected: res.expected,
      error: res.error,
      durationMs,
    });
    console.error(`❌ FAIL [${category}] ${name}: expected ${JSON.stringify(res.expected)}, got ${JSON.stringify(res.actual)} (err: ${res.error})`);
  }
}

console.log("================================================================================");
console.log("          SPEAKLIFE AI — MILESTONE 1 ADVERSARIAL FUZZING HARNESS                ");
console.log("================================================================================\n");

// --------------------------------------------------------------------------------
// 1. FORMATTIME FUZZING
// --------------------------------------------------------------------------------
console.log("▶ [Test Category 1] formatTime Boundary & Adversarial Fuzzing");

// 1.1 Mandatory baseline boundary cases
runEmpiricalCheck("formatTime", "formatTime(-1) === '00:00'", () => {
  const actual = formatTime(-1);
  return { pass: actual === "00:00", actual, expected: "00:00" };
});

runEmpiricalCheck("formatTime", "formatTime(-999999) === '00:00'", () => {
  const actual = formatTime(-999999);
  return { pass: actual === "00:00", actual, expected: "00:00" };
});

runEmpiricalCheck("formatTime", "formatTime(0) === '00:00'", () => {
  const actual = formatTime(0);
  return { pass: actual === "00:00", actual, expected: "00:00" };
});

runEmpiricalCheck("formatTime", "formatTime(-0) === '00:00'", () => {
  const actual = formatTime(-0);
  return { pass: actual === "00:00", actual, expected: "00:00" };
});

runEmpiricalCheck("formatTime", "formatTime(NaN) === '00:00'", () => {
  const actual = formatTime(NaN);
  return { pass: actual === "00:00", actual, expected: "00:00" };
});

runEmpiricalCheck("formatTime", "formatTime(Infinity) === '00:00'", () => {
  const actual = formatTime(Infinity);
  return { pass: actual === "00:00", actual, expected: "00:00" };
});

runEmpiricalCheck("formatTime", "formatTime(-Infinity) === '00:00'", () => {
  const actual = formatTime(-Infinity);
  return { pass: actual === "00:00", actual, expected: "00:00" };
});

runEmpiricalCheck("formatTime", "formatTime(null as any) === '00:00'", () => {
  const actual = formatTime(null as any);
  return { pass: actual === "00:00", actual, expected: "00:00" };
});

runEmpiricalCheck("formatTime", "formatTime(undefined as any) === '00:00'", () => {
  const actual = formatTime(undefined as any);
  return { pass: actual === "00:00", actual, expected: "00:00" };
});

runEmpiricalCheck("formatTime", "formatTime(72.84) === '01:12'", () => {
  const actual = formatTime(72.84);
  return { pass: actual === "01:12", actual, expected: "01:12" };
});

runEmpiricalCheck("formatTime", "formatTime(10^9) === '16666666:40'", () => {
  const actual = formatTime(10 ** 9);
  return { pass: actual === "16666666:40", actual, expected: "16666666:40" };
});

// 1.2 Invariant: Never throw, never return 'NaN:NaN' across comprehensive input types
const fuzzTypeInputs = [
  -1, -999999, 0, -0, NaN, Infinity, -Infinity, null, undefined,
  "NaN", "0", "120", {}, [], () => {}, true, false, 72.84, 10 ** 9,
  Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MAX_VALUE,
  Number.MIN_VALUE, Number.EPSILON, Math.PI, 59.999, 60.0001, 3599.999,
  Symbol("sec")
];

for (const input of fuzzTypeInputs) {
  const inputStr = typeof input === "symbol" ? "Symbol(sec)" : String(input);
  runEmpiricalCheck("formatTime", `formatTime(${inputStr}) does not throw and !== 'NaN:NaN'`, () => {
    let res: string;
    try {
      res = formatTime(input as any);
    } catch (e: any) {
      return { pass: false, actual: `threw ${e.message}`, expected: "non-throwing string" };
    }
    const isClean = res !== "NaN:NaN" && typeof res === "string" && res.includes(":");
    return { pass: isClean, actual: res, expected: "valid formatted string != 'NaN:NaN'" };
  });
}

// 1.3 Random 10,000 Iteration Stress Fuzz
runEmpiricalCheck("formatTime", "10,000 random adversarial inputs survive without throwing or 'NaN:NaN'", () => {
  for (let i = 0; i < 10000; i++) {
    const mode = i % 5;
    let val: number;
    if (mode === 0) val = Math.random() * 7200;
    else if (mode === 1) val = -Math.random() * 1000000;
    else if (mode === 2) val = Math.random() * 1e14;
    else if (mode === 3) val = (Math.random() - 0.5) * 1e-6;
    else val = [NaN, Infinity, -Infinity, 0, -0][i % 5];

    const out = formatTime(val);
    if (out === "NaN:NaN" || typeof out !== "string" || !out.includes(":")) {
      return { pass: false, actual: out, expected: "valid MM:SS string" };
    }
  }
  return { pass: true, actual: "10,000 iterations passed" };
});

// --------------------------------------------------------------------------------
// 2. CN() FUZZING & TAILWIND MERGE RESOLUTION
// --------------------------------------------------------------------------------
console.log("▶ [Test Category 2] cn() Class Composition & Tailwind-Merge Fuzzing");

runEmpiricalCheck("cn", "cn() with empty arguments returns ''", () => {
  const actual = cn();
  return { pass: actual === "", actual, expected: "" };
});

runEmpiricalCheck("cn", "cn(true && 'class', false && 'class') returns 'class'", () => {
  const actual = cn(true && "class", false && "class");
  return { pass: actual === "class", actual, expected: "class" };
});

runEmpiricalCheck("cn", "cn(undefined, null) returns ''", () => {
  const actual = cn(undefined, null);
  return { pass: actual === "", actual, expected: "" };
});

runEmpiricalCheck("cn", "cn() flattens 5-level deeply nested arrays", () => {
  const actual = cn(["p-2", ["text-sm", ["font-bold", ["rounded-lg", ["shadow-md"]]]]]);
  const expected = "p-2 text-sm font-bold rounded-lg shadow-md";
  return { pass: actual === expected, actual, expected };
});

runEmpiricalCheck("cn", "cn() evaluates object boolean keys accurately", () => {
  const actual = cn({ "text-red-500": true, "text-blue-500": false, "opacity-100": true, "hidden": 0 });
  const expected = "text-red-500 opacity-100";
  return { pass: actual === expected, actual, expected };
});

// Tailwind conflict merges
runEmpiricalCheck("cn", "cn('p-4', 'p-2') merges to 'p-2'", () => {
  const actual = cn("p-4", "p-2");
  return { pass: actual === "p-2", actual, expected: "p-2" };
});

runEmpiricalCheck("cn", "cn('text-red-500', 'text-blue-500') merges to 'text-blue-500'", () => {
  const actual = cn("text-red-500", "text-blue-500");
  return { pass: actual === "text-blue-500", actual, expected: "text-blue-500" };
});

runEmpiricalCheck("cn", "cn('px-4 py-2', 'p-8') shorthand overrides directional padding", () => {
  const actual = cn("px-4 py-2", "p-8");
  return { pass: actual === "p-8", actual, expected: "p-8" };
});

runEmpiricalCheck("cn", "cn('bg-red-500', 'bg-blue-500', 'bg-emerald-600') merges to 'bg-emerald-600'", () => {
  const actual = cn("bg-red-500", "bg-blue-500", "bg-emerald-600");
  return { pass: actual === "bg-emerald-600", actual, expected: "bg-emerald-600" };
});

runEmpiricalCheck("cn", "cn('block flex hidden') merges display utilities to 'hidden'", () => {
  const actual = cn("block flex hidden");
  return { pass: actual === "hidden", actual, expected: "hidden" };
});

runEmpiricalCheck("cn", "cn() handles complex mix of falsy, arrays, objects, and conflicts", () => {
  const actual = cn(
    "base-layer",
    null,
    undefined,
    false,
    ["nested-1", [null, ["nested-2", { "nested-3": true, "nested-disabled": false }]]],
    "p-4",
    "p-2",
    "text-red-500",
    "text-blue-500"
  );
  const expected = "base-layer nested-1 nested-2 nested-3 p-2 text-blue-500";
  return { pass: actual === expected, actual, expected };
});

runEmpiricalCheck("cn", "cn() handles BigInt and Symbol without throwing", () => {
  let resBigInt = "";
  let resSymbol = "";
  try {
    resBigInt = cn(BigInt(42) as any);
    resSymbol = cn(Symbol("style") as any);
  } catch (err: any) {
    return { pass: false, error: err.message };
  }
  return { pass: typeof resBigInt === "string" && typeof resSymbol === "string", actual: { resBigInt, resSymbol } };
});

// 5,000 Iteration Random Fuzzing for cn
runEmpiricalCheck("cn", "5,000 random permutations survive without runtime exceptions", () => {
  const classPool = [
    "p-1", "p-2", "p-4", "p-8", "m-1", "m-2", "text-xs", "text-sm", "text-lg",
    "text-red-500", "text-blue-500", "bg-surface", "bg-primary", "flex", "grid", "hidden"
  ];
  for (let i = 0; i < 5000; i++) {
    const c1 = classPool[i % classPool.length];
    const c2 = classPool[(i * 5 + 3) % classPool.length];
    const flag = i % 2 === 0;
    const res = cn(flag && c1, !flag && c2, [c2, null, { [c1]: !flag }]);
    if (typeof res !== "string") {
      return { pass: false, actual: res, expected: "string" };
    }
  }
  return { pass: true, actual: "5,000 iterations passed" };
});

// --------------------------------------------------------------------------------
// 3. CLAMP() ADVERSARIAL BOUNDARY FUZZING
// --------------------------------------------------------------------------------
console.log("▶ [Test Category 3] clamp() Mathematical Invariants & Boundary Fuzzing");

runEmpiricalCheck("clamp", "clamp(2, 5, 10) below min returns 5", () => {
  const actual = clamp(2, 5, 10);
  return { pass: actual === 5, actual, expected: 5 };
});

runEmpiricalCheck("clamp", "clamp(15, 5, 10) above max returns 10", () => {
  const actual = clamp(15, 5, 10);
  return { pass: actual === 10, actual, expected: 10 };
});

runEmpiricalCheck("clamp", "clamp(7, 5, 10) inside interval returns 7", () => {
  const actual = clamp(7, 5, 10);
  return { pass: actual === 7, actual, expected: 7 };
});

runEmpiricalCheck("clamp", "clamp(5, 5, 10) on min boundary returns 5", () => {
  const actual = clamp(5, 5, 10);
  return { pass: actual === 5, actual, expected: 5 };
});

runEmpiricalCheck("clamp", "clamp(10, 5, 10) on max boundary returns 10", () => {
  const actual = clamp(10, 5, 10);
  return { pass: actual === 10, actual, expected: 10 };
});

runEmpiricalCheck("clamp", "clamp(x, 7, 7) with min === max returns 7 for all x", () => {
  const c1 = clamp(3, 7, 7);
  const c2 = clamp(10, 7, 7);
  const c3 = clamp(7, 7, 7);
  return { pass: c1 === 7 && c2 === 7 && c3 === 7, actual: { c1, c2, c3 }, expected: { c1: 7, c2: 7, c3: 7 } };
});

runEmpiricalCheck("clamp", "clamp(5, 10, 2) with inverted min > max returns max (2)", () => {
  const actual = clamp(5, 10, 2);
  return { pass: actual === 2, actual, expected: 2 };
});

runEmpiricalCheck("clamp", "clamp(NaN, 0, 100) returns min (0)", () => {
  const actual = clamp(NaN, 0, 100);
  return { pass: actual === 0, actual, expected: 0 };
});

runEmpiricalCheck("clamp", "clamp(Infinity, 0, 100) returns max (100)", () => {
  const actual = clamp(Infinity, 0, 100);
  return { pass: actual === 100, actual, expected: 100 };
});

runEmpiricalCheck("clamp", "clamp(-Infinity, 0, 100) returns min (0)", () => {
  const actual = clamp(-Infinity, 0, 100);
  return { pass: actual === 0, actual, expected: 0 };
});

runEmpiricalCheck("clamp", "10,000 random iterations satisfy min <= clamp(v, min, max) <= max", () => {
  for (let i = 0; i < 10000; i++) {
    const min = (Math.random() - 0.5) * 10000;
    const max = min + Math.random() * 10000; // ensures max >= min
    const val = (Math.random() - 0.5) * 50000;
    const res = clamp(val, min, max);
    if (res < min - 1e-9 || res > max + 1e-9 || Number.isNaN(res)) {
      return { pass: false, actual: { val, min, max, res }, expected: "min <= res <= max" };
    }
  }
  return { pass: true, actual: "10,000 iterations passed" };
});

// --------------------------------------------------------------------------------
// 4. FORMATPERCENTAGE() FUZZING
// --------------------------------------------------------------------------------
console.log("▶ [Test Category 4] formatPercentage() Decimal Ratio Fuzzing");

runEmpiricalCheck("formatPercentage", "formatPercentage(0.5) -> '50%'", () => {
  const actual = formatPercentage(0.5);
  return { pass: actual === "50%", actual, expected: "50%" };
});

runEmpiricalCheck("formatPercentage", "formatPercentage(0.784) -> '78%'", () => {
  const actual = formatPercentage(0.784);
  return { pass: actual === "78%", actual, expected: "78%" };
});

runEmpiricalCheck("formatPercentage", "formatPercentage(1) -> '100%'", () => {
  const actual = formatPercentage(1);
  return { pass: actual === "100%", actual, expected: "100%" };
});

runEmpiricalCheck("formatPercentage", "formatPercentage(0) -> '0%'", () => {
  const actual = formatPercentage(0);
  return { pass: actual === "0%", actual, expected: "0%" };
});

runEmpiricalCheck("formatPercentage", "formatPercentage(-0.5) -> '0%'", () => {
  const actual = formatPercentage(-0.5);
  return { pass: actual === "0%", actual, expected: "0%" };
});

runEmpiricalCheck("formatPercentage", "formatPercentage(NaN) -> '0%'", () => {
  const actual = formatPercentage(NaN);
  return { pass: actual === "0%", actual, expected: "0%" };
});

runEmpiricalCheck("formatPercentage", "formatPercentage(Infinity) -> '0%'", () => {
  const actual = formatPercentage(Infinity);
  return { pass: actual === "0%", actual, expected: "0%" };
});

runEmpiricalCheck("formatPercentage", "formatPercentage(-Infinity) -> '0%'", () => {
  const actual = formatPercentage(-Infinity);
  return { pass: actual === "0%", actual, expected: "0%" };
});

runEmpiricalCheck("formatPercentage", "formatPercentage(null) -> '0%'", () => {
  const actual = formatPercentage(null as any);
  return { pass: actual === "0%", actual, expected: "0%" };
});

runEmpiricalCheck("formatPercentage", "formatPercentage(undefined) -> '0%'", () => {
  const actual = formatPercentage(undefined as any);
  return { pass: actual === "0%", actual, expected: "0%" };
});

// --------------------------------------------------------------------------------
// 5. UI COMPONENTS IMPORT & SSR RENDERING STRESS
// --------------------------------------------------------------------------------
console.log("▶ [Test Category 5] UI Primitives Crash-Resilience Stress");

// Helper to safely render to string and assert output
function verifyComponentRender(name: string, elem: React.ReactElement) {
  runEmpiricalCheck("UI Render", name, () => {
    try {
      const html = renderToString(elem);
      if (typeof html !== "string" || html.length === 0) {
        return { pass: false, actual: html, expected: "non-empty HTML string" };
      }
      return { pass: true, actual: `${html.slice(0, 40)}... (${html.length} bytes)` };
    } catch (err: any) {
      return { pass: false, error: err.message };
    }
  });
}

// 5.1 Button (All 9 variants x 4 sizes = 36 matrix combinations)
const buttonVariants: Array<
  "default" | "primary" | "secondary" | "outline" | "ghost" | "destructive" | "danger" | "link" | "cyan"
> = ["default", "primary", "secondary", "outline", "ghost", "destructive", "danger", "link", "cyan"];
const buttonSizes: Array<"sm" | "md" | "lg" | "icon"> = ["sm", "md", "lg", "icon"];

for (const v of buttonVariants) {
  for (const s of buttonSizes) {
    verifyComponentRender(
      `Button(variant=${v}, size=${s})`,
      React.createElement(Button, { variant: v, size: s }, "Click")
    );
  }
}
verifyComponentRender("Button(isLoading=true)", React.createElement(Button, { isLoading: true }, "Loading"));
verifyComponentRender("Button(disabled=true)", React.createElement(Button, { disabled: true }, "Disabled"));
verifyComponentRender("Button(isLoading=true, disabled=true)", React.createElement(Button, { isLoading: true, disabled: true }, "Busy"));
verifyComponentRender("Button(variant='fallback' as any)", React.createElement(Button, { variant: "fallback" as any }, "Fallback"));

// 5.2 Badge (All 10 variants)
const badgeVariants: Array<
  "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "danger" | "brand" | "info" | "neutral"
> = ["default", "secondary", "outline", "success", "warning", "destructive", "danger", "brand", "info", "neutral"];

for (const bv of badgeVariants) {
  verifyComponentRender(`Badge(variant=${bv})`, React.createElement(Badge, { variant: bv }, bv));
}
verifyComponentRender("Badge(variant='unknown' as any)", React.createElement(Badge, { variant: "unknown" as any }, "Unknown"));
verifyComponentRender("Badge(empty children)", React.createElement(Badge, null));

// 5.3 Card & Subcomponents
verifyComponentRender(
  "Card(full composite hierarchy: Header, Title, Description, Content, Footer)",
  React.createElement(
    Card,
    { variant: "default" },
    React.createElement(
      CardHeader,
      null,
      React.createElement(CardTitle, null, "Card Title"),
      React.createElement(CardDescription, null, "Card Description")
    ),
    React.createElement(CardContent, null, "Card Content"),
    React.createElement(CardFooter, null, "Card Footer")
  )
);
verifyComponentRender("Card(elevated)", React.createElement(Card, { variant: "elevated" }, "Elevated"));
verifyComponentRender("Card(interactive)", React.createElement(Card, { variant: "interactive" }, "Interactive"));

// 5.4 Progress Component (Edge & normal inputs)
verifyComponentRender("Progress(value=50, max=100)", React.createElement(Progress, { value: 50, max: 100 }));
verifyComponentRender("Progress(value=0, showValue=true)", React.createElement(Progress, { value: 0, showValue: true }));
verifyComponentRender("Progress(value=100, label='Complete')", React.createElement(Progress, { value: 100, label: "Complete" }));
verifyComponentRender("Progress(value=-25)", React.createElement(Progress, { value: -25 }));
verifyComponentRender("Progress(value=180)", React.createElement(Progress, { value: 180 }));
verifyComponentRender("Progress(value=NaN)", React.createElement(Progress, { value: NaN }));
verifyComponentRender("Progress(max=0)", React.createElement(Progress, { value: 10, max: 0 }));

// 5.5 Alert Component (All 6 variants x icon flag)
const alertVariants: Array<"default" | "info" | "success" | "warning" | "destructive" | "error"> = [
  "default", "info", "success", "warning", "destructive", "error"
];
for (const av of alertVariants) {
  verifyComponentRender(
    `Alert(variant=${av}, icon=true)`,
    React.createElement(
      Alert,
      { variant: av, icon: true },
      React.createElement(AlertTitle, null, `${av} Title`),
      React.createElement(AlertDescription, null, `${av} Description`)
    )
  );
  verifyComponentRender(
    `Alert(variant=${av}, icon=false)`,
    React.createElement(Alert, { variant: av, icon: false }, "No Icon Body")
  );
}
verifyComponentRender("Alert(variant='unknown' as any)", React.createElement(Alert, { variant: "unknown" as any }, "Fallback"));

// 5.6 Dialog Component & Context Boundary
verifyComponentRender(
  "Dialog(controlled closed hierarchy)",
  React.createElement(
    Dialog,
    {
      open: false,
      children: React.createElement(
        React.Fragment,
        null,
        React.createElement(DialogTrigger, null, "Open Dialog"),
        React.createElement(
          DialogContent,
          null,
          React.createElement(DialogHeader, null, React.createElement(DialogTitle, null, "Title")),
          React.createElement(DialogDescription, null, "Desc"),
          React.createElement(DialogFooter, null, React.createElement(DialogClose, null, "Close"))
        )
      )
    }
  )
);

// Context boundary verification: DialogTrigger outside Dialog must throw
runEmpiricalCheck("UI Render", "DialogTrigger throws error when used outside DialogContext", () => {
  try {
    renderToString(React.createElement(DialogTrigger, null, "Orphan"));
    return { pass: false, actual: "Did not throw", expected: "Should throw Error" };
  } catch (err: any) {
    const isExpected = err.message.includes("Dialog components must be used within a <Dialog /> wrapper");
    return { pass: isExpected, actual: err.message, expected: "Context error message" };
  }
});

// 5.7 EdgeStateAlert (All 5 valid states)
const edgeTypes: Array<"camera_denied" | "mic_denied" | "webgl_failed" | "api_timeout" | "low_fps"> = [
  "camera_denied", "mic_denied", "webgl_failed", "api_timeout", "low_fps"
];
for (const et of edgeTypes) {
  verifyComponentRender(
    `EdgeStateAlert(type=${et})`,
    React.createElement(EdgeStateAlert, { type: et, onRetry: () => {} })
  );
}

// 5.8 Navbar & Footer
verifyComponentRender("Navbar()", React.createElement(Navbar, null));

// --------------------------------------------------------------------------------
// SUMMARY & METRICS
// --------------------------------------------------------------------------------
console.log("\n================================================================================");
console.log("                     HARNESS EXECUTION SUMMARY & METRICS                       ");
console.log("================================================================================");
console.log(`• Total Assertions Evaluated : ${totalAssertions}`);
console.log(`• Passed Assertions          : ${passedAssertions}`);
console.log(`• Failed Assertions          : ${failedAssertions}`);
console.log(`• Pass Rate                  : ${((passedAssertions / totalAssertions) * 100).toFixed(2)}%`);
console.log(`• Stress Loops Executed      : 25,000 iterations (10k formatTime + 5k cn + 10k clamp)`);
console.log("================================================================================\n");

if (failedAssertions > 0) {
  console.error(`❌ FINAL VERDICT: REJECT (${failedAssertions} assertions failed).`);
  process.exit(1);
} else {
  console.log("✅ FINAL VERDICT: APPROVE (All adversarial fuzzing & stress gates passed).");
  process.exit(0);
}
