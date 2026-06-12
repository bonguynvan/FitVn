/**
 * Vietnamese food database — FCT-2007 model (per 100 g EDIBLE portion).
 *
 * Values below are CURATED APPROXIMATIONS to validate the data model end-to-end.
 * Replace with exact figures from the Vietnamese Food Composition Table 2007
 * (Viện Dinh dưỡng / FAO) — or a digitized dataset — before any clinical features.
 *
 * Missing/unknown nutrients are `null` (rendered "—", excluded from adequacy math),
 * NOT 0. Use 0 only when a nutrient is genuinely absent (e.g. fat in sugar).
 */

export interface FoodNutrients {
  /** kcal per 100 g edible */
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  sodiumMg: number | null;
  calciumMg: number | null;
  ironMg: number | null;
  /** mg purine per 100 g (for gout) — null = unknown */
  purineMg: number | null;
}

export interface FoodItem {
  id: string;
  name: string;
  nameEn: string;
  group: string;
  /** % of fresh purchased weight discarded (bone, peel…); 0 for ready dishes. */
  refusePct: number;
  /** Nutrients per 100 g of the EDIBLE portion. */
  per100g: FoodNutrients;
  /** A natural serving, in grams of edible portion, for friendly entry. */
  serving: { unit: string; grams: number };
  custom?: boolean;
}

type Row = [
  id: string,
  name: string,
  nameEn: string,
  group: string,
  refusePct: number,
  unit: string,
  grams: number,
  cal: number,
  p: number,
  c: number,
  f: number,
  fiber: number | null,
  sodium: number | null,
  calcium: number | null,
  iron: number | null,
  purine: number | null,
];

// prettier-ignore
const ROWS: Row[] = [
  // Ngũ cốc & khoai củ
  ["com-trang","Cơm trắng","Steamed rice","Ngũ cốc",0,"chén",100, 130,2.7,28,0.3,0.4,1,10,0.2,null],
  ["bun-tuoi","Bún","Rice vermicelli","Ngũ cốc",0,"bát",180, 110,1.7,25,0.1,0.5,10,5,0.3,null],
  ["banh-pho","Bánh phở","Pho noodles","Ngũ cốc",0,"bát",200, 140,3,33,0.3,0.6,20,8,0.4,null],
  ["banh-mi","Bánh mì","Bread","Ngũ cốc",0,"ổ",90, 270,9,52,3,2.4,490,40,3.6,null],
  ["yen-mach","Yến mạch","Oats","Ngũ cốc",0,"phần",40, 380,13,67,7,10,5,52,4.7,null],
  ["khoai-lang","Khoai lang luộc","Sweet potato (boiled)","Khoai củ",10,"củ",130, 86,1.6,20,0.1,3,55,30,0.6,null],
  ["khoai-tay","Khoai tây luộc","Potato (boiled)","Khoai củ",12,"củ",150, 87,1.9,20,0.1,1.8,5,8,0.3,null],
  ["ngo-luoc","Ngô luộc","Corn (boiled)","Ngũ cốc",45,"bắp",100, 96,3.4,21,1.5,2.4,15,3,0.5,null],
  // Đạm động vật
  ["uc-ga","Ức gà luộc","Chicken breast","Đạm động vật",5,"phần",150, 165,31,0,3.6,0,74,12,1,150],
  ["thit-ga","Thịt gà","Chicken","Đạm động vật",30,"phần",120, 239,27,0,14,0,82,11,1.3,140],
  ["thit-bo","Thịt bò nạc","Lean beef","Đạm động vật",2,"phần",120, 182,21,0,10,0,55,8,2.6,120],
  ["thit-heo-nac","Thịt heo nạc","Lean pork","Đạm động vật",5,"phần",120, 143,21,0,6,0,55,7,0.9,120],
  ["ba-chi","Thịt ba chỉ","Pork belly","Đạm động vật",5,"phần",80, 518,9,0,53,0,40,5,0.6,100],
  ["gan-heo","Gan heo","Pork liver","Đạm động vật",5,"phần",80, 134,21,2.5,3.6,0,87,9,12,300],
  // Thủy sản
  ["ca-hoi","Cá hồi","Salmon","Thủy sản",10,"phần",150, 208,20,0,13,0,59,12,0.8,170],
  ["ca-basa","Cá basa","Basa fish","Thủy sản",35,"phần",150, 130,16,0,7,0,60,15,0.5,150],
  ["tom","Tôm","Shrimp","Thủy sản",45,"phần",100, 99,24,0.2,0.3,0,111,70,0.5,150],
  ["muc","Mực","Squid","Thủy sản",20,"phần",100, 92,15,3,1.4,0,44,32,0.7,135],
  // Trứng & sữa
  ["trung-ga","Trứng gà","Chicken egg","Trứng & sữa",12,"quả",55, 155,13,1.1,11,0,124,50,1.8,null],
  ["sua-tuoi","Sữa tươi","Milk","Trứng & sữa",0,"ly",200, 61,3.2,4.8,3.3,0,43,113,0,null],
  ["sua-chua","Sữa chua","Yogurt","Trứng & sữa",0,"hộp",100, 61,3.5,4.7,3.3,0,46,110,0.1,null],
  ["pho-mai","Phô mai","Cheese","Trứng & sữa",0,"miếng",20, 350,25,2,27,0,650,700,0.4,null],
  ["whey","Whey protein","Whey protein","Trứng & sữa",0,"muỗng",30, 400,80,8,7,0,250,500,3,null],
  // Đậu & hạt
  ["dau-phu","Đậu phụ","Tofu","Đậu & hạt",0,"miếng",100, 76,8,1.9,4.8,0.3,7,350,5.4,null],
  ["dau-nanh","Đậu nành luộc","Soybean (boiled)","Đậu & hạt",0,"phần",80, 141,12,11,6,4,1,100,3,null],
  ["lac","Lạc (đậu phộng)","Peanut","Đậu & hạt",30,"phần",30, 567,26,16,49,8,18,92,4.6,null],
  ["hanh-nhan","Hạnh nhân","Almond","Đậu & hạt",0,"phần",30, 579,21,22,50,12,1,269,3.7,null],
  // Rau
  ["rau-muong","Rau muống","Water spinach","Rau",25,"phần",100, 23,2.6,3.1,0.2,2.1,65,77,1.7,null],
  ["cai-bo-xoi","Cải bó xôi","Spinach","Rau",20,"phần",100, 23,2.9,3.6,0.4,2.2,79,99,2.7,null],
  ["bong-cai-xanh","Bông cải xanh","Broccoli","Rau",25,"phần",100, 34,2.8,7,0.4,2.6,33,47,0.7,null],
  ["ca-rot","Cà rốt","Carrot","Rau",12,"củ",80, 41,0.9,10,0.2,2.8,69,33,0.3,null],
  ["ca-chua","Cà chua","Tomato","Rau",8,"quả",100, 18,0.9,3.9,0.2,1.2,5,10,0.3,null],
  ["dua-leo","Dưa leo","Cucumber","Rau",12,"quả",150, 15,0.7,3.6,0.1,0.5,2,16,0.3,null],
  // Quả
  ["chuoi","Chuối","Banana","Quả",35,"quả",100, 89,1.1,23,0.3,2.6,1,5,0.3,null],
  ["tao","Táo","Apple","Quả",10,"quả",150, 52,0.3,14,0.2,2.4,1,6,0.1,null],
  ["cam","Cam","Orange","Quả",25,"quả",130, 47,0.9,12,0.1,2.4,0,40,0.1,null],
  ["xoai","Xoài","Mango","Quả",30,"quả",200, 60,0.8,15,0.4,1.6,1,11,0.2,null],
  ["bo","Bơ","Avocado","Quả",30,"quả",150, 160,2,9,15,7,7,12,0.6,null],
  // Món ăn (composite — approximate)
  ["pho-bo","Phở bò","Beef pho","Món ăn",0,"tô",500, 86,5,11,2.4,0.4,440,12,1,40],
  ["com-tam-suon","Cơm tấm sườn","Broken rice w/ pork","Món ăn",0,"dĩa",400, 165,8,20,5.9,0.6,400,15,1,35],
  ["bun-bo","Bún bò Huế","Bun bo Hue","Món ăn",0,"tô",450, 107,6.2,13,3.1,0.5,500,14,1.1,40],
  ["banh-mi-thit","Bánh mì thịt","Banh mi","Món ăn",0,"ổ",160, 250,11,31,9,2,520,30,2,30],
  // Dầu & đường
  ["dau-an","Dầu ăn","Cooking oil","Dầu & đường",0,"muỗng",10, 884,0,0,100,0,0,0,0,0],
  ["duong","Đường","Sugar","Dầu & đường",0,"muỗng",8, 387,0,100,0,0,1,1,0,0],
];

export const FOODS: ReadonlyArray<FoodItem> = ROWS.map((r) => ({
  id: r[0],
  name: r[1],
  nameEn: r[2],
  group: r[3],
  refusePct: r[4],
  serving: { unit: r[5], grams: r[6] },
  per100g: {
    calories: r[7],
    protein: r[8],
    carbs: r[9],
    fat: r[10],
    fiber: r[11],
    sodiumMg: r[12],
    calciumMg: r[13],
    ironMg: r[14],
    purineMg: r[15],
  },
}));

export function findFood(id: string): FoodItem | undefined {
  return FOODS.find((f) => f.id === id);
}

/** Nutrient keys (for iterating/scaling). */
export const NUTRIENT_KEYS = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "fiber",
  "sodiumMg",
  "calciumMg",
  "ironMg",
  "purineMg",
] as const;
