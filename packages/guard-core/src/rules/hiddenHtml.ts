import * as cheerio from "cheerio";
import type { AnyNode, Element } from "domhandler";
import type { RuleFinding } from "@agent-guard/shared";
import { maskSensitiveText, MAX_SCAN_CHARS } from "../shield/patterns.js";

export interface HiddenHtmlResult {
  hiddenSegments: Array<{ technique: string; text: string }>;
  visibleText: string;
  fullText: string;
  findings: RuleFinding[];
}

const IMPERATIVE_HINT_RE =
  /\b(ignore|disregard|forget|override|bypass|reveal|system|prompt|instructions?|send|forward|reply|email|share|export|aadhaar|pan|upi|api[\s_-]?key|secret|token|contacts?|notes?|do\s+not\s+tell|you\s+are\s+now|developer\s+mode|act\s+as)\b/i;

function normalizeColor(raw?: string): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/!important/gi, "").trim().toLowerCase();
  if (!cleaned) return null;
  if (cleaned === "white") return "#ffffff";
  if (cleaned === "black") return "#000000";
  if (cleaned === "transparent") return "transparent";
  const hex3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(cleaned);
  if (hex3) {
    return `#${hex3[1]}${hex3[1]}${hex3[2]}${hex3[2]}${hex3[3]}${hex3[3]}`;
  }
  if (/^#[0-9a-f]{6}$/i.test(cleaned)) {
    return cleaned;
  }
  const rgb = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([0-9.]+))?\s*\)$/i.exec(
    cleaned,
  );
  if (rgb) {
    if (rgb[4] !== undefined && Number(rgb[4]) === 0) return "transparent";
    const toHex = (n: string) => Math.min(255, Number(n)).toString(16).padStart(2, "0");
    return `#${toHex(rgb[1])}${toHex(rgb[2])}${toHex(rgb[3])}`;
  }
  return cleaned;
}

function parseStyle(styleAttr?: string): Record<string, string> {
  const map: Record<string, string> = {};
  if (!styleAttr) return map;
  for (const decl of styleAttr.split(";")) {
    const colon = decl.indexOf(":");
    if (colon <= 0) continue;
    const key = decl.slice(0, colon).trim().toLowerCase();
    const val = decl.slice(colon + 1).replace(/!important/gi, "").trim().toLowerCase();
    if (key && val) {
      map[key] = val;
    }
  }
  return map;
}

function isZeroDimension(val?: string): boolean {
  if (!val) return false;
  return /^0+(?:\.0+)?(?:px|pt|em|rem|%|ex|ch)?$/i.test(val.trim());
}

function isLargeNegativePx(val?: string): boolean {
  if (!val) return false;
  const m = /^(-?\d+(?:\.\d+)?)\s*(px|pt|em|rem)?$/i.exec(val.trim());
  if (!m) return false;
  return Number(m[1]) <= -100;
}

function detectElementConcealment(
  el: Element,
  ancestorBg: string | null,
): { techniques: string[]; currentBg: string | null } {
  const techniques: string[] = [];
  const style = parseStyle(el.attribs?.style);

  if (style["display"] === "none") techniques.push("display:none");
  if (style["visibility"] === "hidden") techniques.push("visibility:hidden");
  if (isZeroDimension(style["font-size"])) techniques.push("font-size:0");
  if (style["opacity"] !== undefined && /^0+(?:\.0+)?$/.test(style["opacity"])) {
    techniques.push("opacity:0");
  }

  const overflowHidden = style["overflow"] === "hidden" || style["overflow"] === "clip";
  if (
    overflowHidden &&
    (isZeroDimension(style["height"]) ||
      isZeroDimension(style["max-height"]) ||
      isZeroDimension(style["width"]) ||
      isZeroDimension(style["max-width"]))
  ) {
    techniques.push("zero-dimension-overflow-hidden");
  }

  if (
    isLargeNegativePx(style["left"]) ||
    isLargeNegativePx(style["top"]) ||
    isLargeNegativePx(style["margin-left"])
  ) {
    techniques.push("offscreen-positioning");
  }
  if (isLargeNegativePx(style["text-indent"])) {
    techniques.push("negative-text-indent");
  }

  const fg = normalizeColor(style["color"]);
  const ownBg = normalizeColor(style["background-color"] ?? style["background"]);
  const effectiveBg = ownBg ?? ancestorBg;

  if (fg === "transparent") {
    techniques.push("transparent-text");
  } else if (fg && effectiveBg && fg === effectiveBg) {
    techniques.push("same-color-as-background");
  } else if (fg === "#ffffff" && (!effectiveBg || effectiveBg === "#ffffff")) {
    techniques.push("white-on-white-text");
  }

  return { techniques, currentBg: effectiveBg };
}

/** Parses HTML cleanly with cheerio without executing scripts, locating concealed content. */
export function scanHiddenHtml(rawHtml: string): HiddenHtmlResult {
  const html = rawHtml.length > MAX_SCAN_CHARS ? rawHtml.slice(0, MAX_SCAN_CHARS) : rawHtml;
  const $ = cheerio.load(html);
  const hiddenSegments: Array<{ technique: string; text: string }> = [];
  const findings: RuleFinding[] = [];
  const hiddenElements: Element[] = [];

  function walk(node: AnyNode, ancestorBg: string | null): void {
    if (node.type === "comment") {
      const commentText = (node.data ?? "").replace(/\s+/g, " ").trim();
      if (commentText.length > 0 && IMPERATIVE_HINT_RE.test(commentText)) {
        const masked = maskSensitiveText(commentText).slice(0, 160);
        hiddenSegments.push({ technique: "html-comment", text: masked });
      }
      return;
    }

    if (node.type === "tag" || node.type === "script" || node.type === "style") {
      const el = node as Element;
      const tagName = el.tagName?.toLowerCase();
      if (tagName === "script" || tagName === "style") {
        hiddenElements.push(el);
        return;
      }

      const { techniques, currentBg } = detectElementConcealment(el, ancestorBg);
      const ariaHidden = el.attribs?.["aria-hidden"]?.toLowerCase() === "true";
      const elText = $(el).text().replace(/\s+/g, " ").trim();

      if (ariaHidden && elText.length > 0 && IMPERATIVE_HINT_RE.test(elText)) {
        techniques.push("aria-hidden-imperative");
      }

      if (techniques.length > 0) {
        if (elText.length > 0) {
          hiddenSegments.push({
            technique: techniques.join(", "),
            text: maskSensitiveText(elText).slice(0, 220),
          });
        }
        hiddenElements.push(el);
        return;
      }

      for (const child of el.children ?? []) {
        walk(child, currentBg);
      }
      return;
    }

    if ("children" in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        walk(child, ancestorBg);
      }
    }
  }

  for (const rootChild of $.root()[0].children ?? []) {
    walk(rootChild, null);
  }

  const fullText = $.root().text().replace(/\s+/g, " ").trim();

  // Build visible-only text by removing hidden elements and comments from cloned DOM
  const $visible = cheerio.load(html);
  $visible("script, style").remove();
  $visible("*").each((_, elem) => {
    const el = elem as Element;
    const { techniques } = detectElementConcealment(el, null);
    const ariaHidden = el.attribs?.["aria-hidden"]?.toLowerCase() === "true";
    const text = $visible(el).text().replace(/\s+/g, " ").trim();
    if (techniques.length > 0 || (ariaHidden && IMPERATIVE_HINT_RE.test(text))) {
      $visible(el).remove();
    }
  });
  const visibleText = $visible.root().text().replace(/\s+/g, " ").trim();

  if (hiddenSegments.length > 0) {
    const primary = hiddenSegments[0];
    const extraCount = hiddenSegments.length - 1;
    findings.push({
      layer: "rule",
      category: "hidden_html",
      attackType: "hidden_content",
      scoreImpact: 40,
      technique: hiddenSegments.map((s) => s.technique).join("; "),
      summary: `Concealed HTML text detected (${primary.technique})${extraCount > 0 ? ` + ${extraCount} more` : ""}`,
      snippet: primary.text.slice(0, 160),
    });
  }

  return {
    hiddenSegments,
    visibleText,
    fullText,
    findings,
  };
}

