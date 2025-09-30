import type { Talent } from "@/data/trip-data";

export function findTalentInTitle(title: string, TALENT: Talent[]): string[] {
  return TALENT
    .filter(t => {
      const titleLower = title.toLowerCase();
      const nameLower = t.name.toLowerCase();

      // Check for exact name matches first
      if (titleLower.includes(nameLower)) return true;

      // Special cases for specific performers
      if (t.name === "Audra McDonald" && titleLower.includes("audra mcdonald")) return true;
      if (t.name === "The Diva (Bingo)" && titleLower.includes("bingo")) return true;
      if (t.name === "Monét X Change" && titleLower.includes("monet")) return true;
      if (t.name === "Sherry Vine" && titleLower.includes("sherry")) return true;
      if (t.name === "Alexis Michelle" && titleLower.includes("alexis")) return true;
      if (t.name === "Reuben Kaye" && titleLower.includes("reuben")) return true;
      if (t.name === "Rob Houchen" && titleLower.includes("rob")) return true;
      if (t.name === "Alyssa Wray" && titleLower.includes("alyssa")) return true;
      if (t.name === "Brad Loekle" && titleLower.includes("brad")) return true;
      if (t.name === "Rachel Scanlon" && titleLower.includes("rachel")) return true;
      if (t.name === "Daniel Webb" && titleLower.includes("daniel")) return true;
      if (t.name === "Leona Winter" && titleLower.includes("leona")) return true;
      if (t.name === "AirOtic" && titleLower.includes("airotic")) return true;
      if (t.name === "Another Rose" && titleLower.includes("another rose")) return true;
      if (t.name === "Persephone" && titleLower.includes("persephone")) return true;
      if (t.name === "William TN Hall" && titleLower.includes("william")) return true;
      if (t.name === "Brian Nash" && titleLower.includes("brian")) return true;
      if (t.name === "Brandon James Gwinn" && titleLower.includes("brandon")) return true;

      return false;
    })
    .map(t => t.name);
}