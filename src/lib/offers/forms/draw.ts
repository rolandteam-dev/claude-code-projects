/**
 * Offer Machine — drawing helpers shared by the form fillers.
 *
 * Positions come from where the team's own filled forms put their text, measured with pdfplumber
 * (top-left origin, `top` = top of the text line, `x` = start of the text). The baseline is computed
 * from `top` and the font size so text lands exactly where TransactionDesk puts it.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

export const PAGE_H = 792;
export const INK = rgb(0.05, 0.1, 0.55);

export interface Pen {
  doc: PDFDocument;
  font: PDFFont;
  bold: PDFFont;
}

export async function openForm(blank: Uint8Array, expectedPages: number, name: string): Promise<Pen> {
  const doc = await PDFDocument.load(blank);
  if (doc.getPageCount() !== expectedPages) {
    throw new Error(`${name} has ${doc.getPageCount()} pages, expected ${expectedPages}: the form was revised, re-map its layout`);
  }
  return { doc, font: await doc.embedFont(StandardFonts.Helvetica), bold: await doc.embedFont(StandardFonts.HelveticaBold) };
}

/** Text starting at x, whose line top is `top`; shrinks (down to 5.5pt) to fit `maxWidth`. */
export function put(pen: Pen, page: number, value: string | undefined, x: number, top: number, size = 9, maxWidth?: number): void {
  if (!value) return;
  let s = size;
  if (maxWidth) while (s > 5.5 && pen.font.widthOfTextAtSize(value, s) > maxWidth) s -= 0.5;
  pen.doc.getPage(page - 1).drawText(value, { x, y: PAGE_H - (top + 0.793 * s), size: s, font: pen.font, color: INK });
}

/** A cross in a checkbox whose glyph sits at (x, top) at `size` pt (the team's forms use ZapfDingbats there). */
export function cross(pen: Pen, page: number, x: number, top: number, size = 8): void {
  pen.doc.getPage(page - 1).drawText("X", { x: x + 0.9, y: PAGE_H - (top + 0.793 * size) - 0.6, size: size + 0.5, font: pen.bold, color: INK });
}

/** "Jossue Munoz" / "Jossue Munoz & Jennifer Huglin" style split used by the two-buyer slots on the forms. */
export function splitBuyers(buyerNames: string[] | undefined, clientName: string): string[] {
  if (buyerNames?.length) return buyerNames;
  return clientName.split(/\s+(?:and|&)\s+|\s*,\s*/i).map((n) => n.trim()).filter(Boolean);
}
