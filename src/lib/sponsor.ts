export type SkipSegment = {
  category: string;
  start: number;
  end: number;
};

export const SKIP_CATEGORIES = [
  "sponsor",
  "selfpromo",
  "intro",
  "outro",
  "interaction",
] as const;

export function skipLabel(category: string): string {
  switch (category) {
    case "sponsor":
      return "Skipped sponsor";
    case "selfpromo":
      return "Skipped promo";
    case "intro":
      return "Skipped intro";
    case "outro":
      return "Skipped outro";
    case "interaction":
      return "Skipped reminder";
    default:
      return "Skipped";
  }
}
