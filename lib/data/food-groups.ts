/**
 * FCT food groups, in display order. Used for browsing the database.
 *
 * Kept in its own tiny module (separate from the heavy foods-db catalog) so UI
 * that only needs the group labels — e.g. the nutrition group browser — doesn't
 * pull the ~126 KB food dataset into its initial bundle.
 */
export const FOOD_GROUPS = [
  "Ngũ cốc",
  "Khoai củ",
  "Đậu & hạt",
  "Rau",
  "Trái cây",
  "Thịt",
  "Thủy sản",
  "Trứng",
  "Sữa",
  "Dầu mỡ",
  "Đường & bánh kẹo",
  "Gia vị",
  "Đồ uống",
  "Món ăn",
] as const;

export type FoodGroup = (typeof FOOD_GROUPS)[number];
