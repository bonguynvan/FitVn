/**
 * Vietnamese food database — FCT-2007 model (per 100 g EDIBLE portion).
 *
 * Values below are CURATED APPROXIMATIONS drawn from common Vietnamese/USDA
 * nutrition references to make the app useful for calorie + health checks.
 * They are NOT the exact Vietnamese Food Composition Table 2007 figures — swap
 * in a digitized FCT dataset (Viện Dinh dưỡng / FAO, 526 foods, 86 components)
 * before any clinical use. Foods are organized into the FCT food groups.
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

/** FCT food groups, in display order. Used for browsing the database. */
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

type Row = [
  id: string,
  name: string,
  nameEn: string,
  group: FoodGroup,
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
  // ── Ngũ cốc ────────────────────────────────────────────────────────────────
  ["com-trang","Cơm trắng","Steamed rice","Ngũ cốc",0,"chén",100, 130,2.7,28,0.3,0.4,1,10,0.2,null],
  ["com-gao-lut","Cơm gạo lứt","Brown rice (cooked)","Ngũ cốc",0,"chén",100, 111,2.6,23,0.9,1.8,5,10,0.5,null],
  ["gao-te","Gạo tẻ (sống)","White rice (raw)","Ngũ cốc",0,"phần",80, 344,7.9,77,1,0.4,5,30,1.3,null],
  ["xoi","Xôi","Sticky rice","Ngũ cốc",0,"gói",150, 175,3.5,39,0.3,0.5,5,4,0.7,null],
  ["bun-tuoi","Bún","Rice vermicelli","Ngũ cốc",0,"bát",180, 110,1.7,25,0.1,0.5,10,5,0.3,null],
  ["banh-pho","Bánh phở","Pho noodles","Ngũ cốc",0,"bát",200, 140,3,33,0.3,0.6,20,8,0.4,null],
  ["mien","Miến (khô)","Glass noodles (dry)","Ngũ cốc",0,"phần",50, 332,0.2,86,0.1,1,9,25,2.5,null],
  ["banh-mi","Bánh mì","Bread","Ngũ cốc",0,"ổ",90, 270,9,52,3,2.4,490,40,3.6,null],
  ["mi-tom","Mì tôm (gói)","Instant noodles","Ngũ cốc",0,"gói",75, 448,9,62,18,2.5,1800,20,4,null],
  ["yen-mach","Yến mạch","Oats","Ngũ cốc",0,"phần",40, 380,13,67,7,10,5,52,4.7,null],
  ["ngo-luoc","Ngô luộc","Corn (boiled)","Ngũ cốc",45,"bắp",100, 96,3.4,21,1.5,2.4,15,3,0.5,null],
  ["bot-mi","Bột mì","Wheat flour","Ngũ cốc",0,"phần",30, 364,10,76,1,2.7,2,15,1.2,null],
  // ── Khoai củ ───────────────────────────────────────────────────────────────
  ["khoai-lang","Khoai lang luộc","Sweet potato (boiled)","Khoai củ",10,"củ",130, 86,1.6,20,0.1,3,55,30,0.6,null],
  ["khoai-tay","Khoai tây luộc","Potato (boiled)","Khoai củ",12,"củ",150, 87,1.9,20,0.1,1.8,5,8,0.3,null],
  ["khoai-mon","Khoai môn","Taro (cooked)","Khoai củ",15,"củ",120, 112,1.5,26,0.2,4,11,43,0.7,null],
  ["khoai-mi","Khoai mì (sắn)","Cassava","Khoai củ",20,"phần",120, 160,1.4,38,0.3,1.8,14,16,0.3,null],
  // ── Đậu & hạt ──────────────────────────────────────────────────────────────
  ["dau-phu","Đậu phụ","Tofu","Đậu & hạt",0,"miếng",100, 76,8,1.9,4.8,0.3,7,350,5.4,30],
  ["dau-nanh","Đậu nành luộc","Soybean (boiled)","Đậu & hạt",0,"phần",80, 141,12,11,6,4,1,100,3,50],
  ["dau-xanh","Đậu xanh","Mung bean (cooked)","Đậu & hạt",0,"phần",80, 105,7,19,0.4,7.6,2,27,1.4,40],
  ["dau-den","Đậu đen","Black bean (cooked)","Đậu & hạt",0,"phần",80, 132,8.9,24,0.5,8.7,2,27,2.1,75],
  ["dau-do","Đậu đỏ","Red bean (cooked)","Đậu & hạt",0,"phần",80, 127,7.5,23,0.1,7,2,28,2,50],
  ["lac","Lạc (đậu phộng)","Peanut","Đậu & hạt",30,"phần",30, 567,26,16,49,8,18,92,4.6,80],
  ["hanh-nhan","Hạnh nhân","Almond","Đậu & hạt",0,"phần",30, 579,21,22,50,12,1,269,3.7,null],
  ["hat-dieu","Hạt điều","Cashew","Đậu & hạt",0,"phần",30, 553,18,30,44,3.3,12,37,6.7,null],
  ["hat-chia","Hạt chia","Chia seed","Đậu & hạt",0,"muỗng",15, 486,17,42,31,34,16,631,7.7,null],
  ["me","Mè (vừng)","Sesame","Đậu & hạt",0,"muỗng",15, 573,18,23,50,12,11,975,14.6,null],
  // ── Rau ────────────────────────────────────────────────────────────────────
  ["rau-muong","Rau muống","Water spinach","Rau",25,"phần",100, 23,2.6,3.1,0.2,2.1,65,77,1.7,null],
  ["cai-bo-xoi","Cải bó xôi","Spinach","Rau",20,"phần",100, 23,2.9,3.6,0.4,2.2,79,99,2.7,null],
  ["bong-cai-xanh","Bông cải xanh","Broccoli","Rau",25,"phần",100, 34,2.8,7,0.4,2.6,33,47,0.7,null],
  ["cai-thia","Cải thìa","Bok choy","Rau",15,"phần",100, 13,1.5,2.2,0.2,1,65,105,0.8,null],
  ["bap-cai","Bắp cải","Cabbage","Rau",20,"phần",100, 25,1.3,5.8,0.1,2.5,18,40,0.5,null],
  ["ca-rot","Cà rốt","Carrot","Rau",12,"củ",80, 41,0.9,10,0.2,2.8,69,33,0.3,null],
  ["ca-chua","Cà chua","Tomato","Rau",8,"quả",100, 18,0.9,3.9,0.2,1.2,5,10,0.3,null],
  ["dua-leo","Dưa leo","Cucumber","Rau",12,"quả",150, 15,0.7,3.6,0.1,0.5,2,16,0.3,null],
  ["bi-do","Bí đỏ","Pumpkin","Rau",30,"phần",100, 26,1,6.5,0.1,0.5,1,21,0.8,null],
  ["muop","Mướp","Luffa","Rau",20,"quả",150, 20,1.2,4.4,0.2,1.1,3,20,0.4,null],
  ["gia-do","Giá đỗ","Bean sprouts","Rau",5,"phần",100, 30,3,5.9,0.2,1.8,6,13,0.9,null],
  ["nam-rom","Nấm rơm","Straw mushroom","Rau",10,"phần",100, 33,3.8,5,0.2,2.5,9,3,1.4,50],
  ["nam-kim-cham","Nấm kim châm","Enoki mushroom","Rau",5,"phần",100, 37,2.7,8,0.3,2.7,3,1,1.1,50],
  ["ot-chuong","Ớt chuông","Bell pepper","Rau",18,"quả",100, 31,1,6,0.3,2.1,4,7,0.4,null],
  ["dau-bap","Đậu bắp","Okra","Rau",10,"phần",100, 33,1.9,7,0.2,3.2,7,82,0.6,null],
  ["mong-toi","Mồng tơi","Malabar spinach","Rau",20,"phần",100, 19,1.8,3.4,0.3,2,24,109,1.2,null],
  ["rau-den","Rau dền","Amaranth greens","Rau",20,"phần",100, 23,2.5,4,0.3,2.2,20,215,2.3,null],
  ["cai-xanh","Cải xanh","Mustard greens","Rau",18,"phần",100, 22,2.9,4.7,0.4,3.2,20,115,1.5,null],
  // ── Trái cây ───────────────────────────────────────────────────────────────
  ["chuoi","Chuối","Banana","Trái cây",35,"quả",100, 89,1.1,23,0.3,2.6,1,5,0.3,null],
  ["tao","Táo","Apple","Trái cây",10,"quả",150, 52,0.3,14,0.2,2.4,1,6,0.1,null],
  ["cam","Cam","Orange","Trái cây",25,"quả",130, 47,0.9,12,0.1,2.4,0,40,0.1,null],
  ["xoai","Xoài","Mango","Trái cây",30,"quả",200, 60,0.8,15,0.4,1.6,1,11,0.2,null],
  ["bo","Bơ","Avocado","Trái cây",30,"quả",150, 160,2,9,15,7,7,12,0.6,null],
  ["du-du","Đu đủ","Papaya","Trái cây",33,"phần",150, 43,0.5,11,0.3,1.7,8,20,0.3,null],
  ["dua-hau","Dưa hấu","Watermelon","Trái cây",48,"phần",200, 30,0.6,8,0.2,0.4,1,7,0.2,null],
  ["nho","Nho","Grape","Trái cây",5,"phần",100, 69,0.7,18,0.2,0.9,2,10,0.4,null],
  ["thanh-long","Thanh long","Dragon fruit","Trái cây",35,"quả",250, 60,1.2,13,0,3,0,9,0.7,null],
  ["oi","Ổi","Guava","Trái cây",10,"quả",150, 68,2.6,14,1,5.4,2,18,0.3,null],
  ["dua-thom","Dứa (thơm)","Pineapple","Trái cây",45,"phần",150, 50,0.5,13,0.1,1.4,1,13,0.3,null],
  ["buoi","Bưởi","Pomelo","Trái cây",45,"phần",150, 38,0.8,10,0,1,1,4,0.1,null],
  ["nhan","Nhãn","Longan","Trái cây",35,"phần",100, 60,1.3,15,0.1,1.1,0,1,0.1,null],
  ["vai","Vải","Lychee","Trái cây",40,"phần",100, 66,0.8,17,0.4,1.3,1,5,0.3,null],
  ["mang-cut","Măng cụt","Mangosteen","Trái cây",65,"quả",80, 73,0.4,18,0.6,1.8,7,12,0.3,null],
  ["sau-rieng","Sầu riêng","Durian","Trái cây",65,"phần",100, 147,1.5,27,5,3.8,2,6,0.4,null],
  ["le","Lê","Pear","Trái cây",10,"quả",150, 57,0.4,15,0.1,3.1,1,9,0.2,null],
  // ── Thịt ───────────────────────────────────────────────────────────────────
  ["uc-ga","Ức gà luộc","Chicken breast","Thịt",5,"phần",150, 165,31,0,3.6,0,74,12,1,150],
  ["thit-ga","Thịt gà","Chicken","Thịt",30,"phần",120, 239,27,0,14,0,82,11,1.3,140],
  ["dui-ga","Đùi gà","Chicken thigh","Thịt",25,"cái",120, 209,26,0,11,0,86,8,1.3,140],
  ["thit-bo","Thịt bò nạc","Lean beef","Thịt",2,"phần",120, 182,21,0,10,0,55,8,2.6,120],
  ["thit-heo-nac","Thịt heo nạc","Lean pork","Thịt",5,"phần",120, 143,21,0,6,0,55,7,0.9,120],
  ["ba-chi","Thịt ba chỉ","Pork belly","Thịt",5,"phần",80, 518,9,0,53,0,40,5,0.6,100],
  ["suon-heo","Sườn heo","Pork ribs","Thịt",20,"phần",120, 277,18,0,22,0,60,15,1,110],
  ["gan-heo","Gan heo","Pork liver","Thịt",5,"phần",80, 134,21,2.5,3.6,0,87,9,12,300],
  ["thit-vit","Thịt vịt","Duck","Thịt",30,"phần",120, 337,19,0,28,0,59,11,2.7,140],
  ["xuc-xich","Xúc xích","Sausage","Thịt",0,"cái",40, 301,12,2,27,0,900,12,1,80],
  ["gio-lua","Giò lụa","Pork ham (giò)","Thịt",0,"phần",50, 280,15,2,23,0,800,10,1,90],
  // ── Thủy sản ───────────────────────────────────────────────────────────────
  ["ca-hoi","Cá hồi","Salmon","Thủy sản",10,"phần",150, 208,20,0,13,0,59,12,0.8,170],
  ["ca-basa","Cá basa","Basa fish","Thủy sản",35,"phần",150, 130,16,0,7,0,60,15,0.5,150],
  ["ca-thu","Cá thu","Mackerel","Thủy sản",30,"phần",120, 205,19,0,14,0,90,12,1.6,194],
  ["ca-ngu","Cá ngừ","Tuna","Thủy sản",25,"phần",120, 144,23,0,5,0,39,8,1,150],
  ["ca-ro-phi","Cá rô phi","Tilapia","Thủy sản",45,"con",150, 128,26,0,2.7,0,52,10,0.6,80],
  ["tom","Tôm","Shrimp","Thủy sản",45,"phần",100, 99,24,0.2,0.3,0,111,70,0.5,150],
  ["muc","Mực","Squid","Thủy sản",20,"phần",100, 92,15,3,1.4,0,44,32,0.7,135],
  ["cua","Cua","Crab","Thủy sản",60,"con",120, 97,19,0,1.5,0,300,89,0.8,152],
  ["nghieu","Nghêu (ngao)","Clam","Thủy sản",70,"phần",100, 86,14,3,1,0,200,46,3,136],
  ["ca-com","Cá cơm","Anchovy","Thủy sản",20,"phần",80, 131,20,0,4.8,0,104,147,3.3,239],
  // ── Trứng ──────────────────────────────────────────────────────────────────
  ["trung-ga","Trứng gà","Chicken egg","Trứng",12,"quả",55, 155,13,1.1,11,0,124,50,1.8,null],
  ["trung-vit","Trứng vịt","Duck egg","Trứng",12,"quả",70, 185,13,1.4,14,0,146,64,3.9,null],
  ["trung-vit-lon","Trứng vịt lộn","Balut","Trứng",12,"quả",70, 188,14,2,13,0,130,82,3.5,null],
  ["trung-cut","Trứng cút","Quail egg","Trứng",8,"quả",10, 158,13,0.4,11,0,141,64,3.7,null],
  // ── Sữa ────────────────────────────────────────────────────────────────────
  ["sua-tuoi","Sữa tươi","Milk","Sữa",0,"ly",200, 61,3.2,4.8,3.3,0,43,113,0,null],
  ["sua-chua","Sữa chua","Yogurt","Sữa",0,"hộp",100, 61,3.5,4.7,3.3,0,46,110,0.1,null],
  ["pho-mai","Phô mai","Cheese","Sữa",0,"miếng",20, 350,25,2,27,0,650,700,0.4,null],
  ["whey","Whey protein","Whey protein","Sữa",0,"muỗng",30, 400,80,8,7,0,250,500,3,null],
  ["sua-dac","Sữa đặc","Condensed milk","Sữa",0,"muỗng",20, 321,8,54,9,0,127,284,0.2,null],
  ["sua-dau-nanh","Sữa đậu nành","Soy milk","Sữa",0,"ly",200, 54,3.3,6,1.8,0.6,12,25,0.6,null],
  // ── Dầu mỡ ─────────────────────────────────────────────────────────────────
  ["dau-an","Dầu ăn","Cooking oil","Dầu mỡ",0,"muỗng",10, 884,0,0,100,0,0,0,0,0],
  ["mo-heo","Mỡ heo","Lard","Dầu mỡ",0,"muỗng",10, 902,0,0,100,0,0,0,0,0],
  ["bo-thuc-vat","Bơ thực vật","Margarine","Dầu mỡ",0,"muỗng",10, 717,0.2,0.7,81,0,943,3,0,0],
  ["dau-me","Dầu mè","Sesame oil","Dầu mỡ",0,"muỗng",10, 884,0,0,100,0,0,0,0,0],
  // ── Đường & bánh kẹo ───────────────────────────────────────────────────────
  ["duong","Đường","Sugar","Đường & bánh kẹo",0,"muỗng",8, 387,0,100,0,0,1,1,0,0],
  ["mat-ong","Mật ong","Honey","Đường & bánh kẹo",0,"muỗng",20, 304,0.3,82,0,0.2,4,6,0.4,0],
  ["socola","Sô cô la","Chocolate","Đường & bánh kẹo",0,"thanh",40, 546,4.9,61,31,7,24,56,8,0],
  ["banh-quy","Bánh quy","Biscuit","Đường & bánh kẹo",0,"cái",15, 480,6,68,20,2,400,40,2.5,0],
  ["kem","Kem","Ice cream","Đường & bánh kẹo",0,"viên",60, 207,3.5,24,11,0.7,80,128,0.1,0],
  // ── Gia vị ─────────────────────────────────────────────────────────────────
  ["nuoc-mam","Nước mắm","Fish sauce","Gia vị",0,"muỗng",8, 35,5,4,0,0,7800,43,0.7,null],
  ["nuoc-tuong","Nước tương","Soy sauce","Gia vị",0,"muỗng",8, 53,8,5,0,0.8,5500,20,1.5,null],
  ["tuong-ot","Tương ớt","Chili sauce","Gia vị",0,"muỗng",10, 90,1,20,0.5,1.5,1300,15,1,0],
  ["muoi","Muối","Salt","Gia vị",0,"muỗng",5, 0,0,0,0,0,38758,24,0.3,0],
  ["mam-tom","Mắm tôm","Shrimp paste","Gia vị",0,"muỗng",10, 80,12,3,1,0,9000,150,2,null],
  // ── Đồ uống ────────────────────────────────────────────────────────────────
  ["bia","Bia","Beer","Đồ uống",0,"lon",330, 43,0.5,3.6,0,0,4,4,0,14],
  ["ca-phe-den","Cà phê đen","Black coffee","Đồ uống",0,"ly",200, 1,0.1,0,0,0,2,2,0,0],
  ["ca-phe-sua","Cà phê sữa","Coffee with milk","Đồ uống",0,"ly",200, 60,1.5,10,1.5,0,30,50,0.1,null],
  ["tra-da","Trà đá","Iced tea","Đồ uống",0,"ly",250, 1,0,0.3,0,0,1,0,0,0],
  ["nuoc-ngot","Nước ngọt","Soft drink","Đồ uống",0,"lon",330, 42,0,11,0,0,4,2,0,0],
  ["nuoc-cam-ep","Nước cam ép","Orange juice","Đồ uống",0,"ly",250, 45,0.7,10,0.2,0.2,1,11,0.2,null],
  ["nuoc-dua","Nước dừa","Coconut water","Đồ uống",0,"trái",300, 19,0.7,3.7,0.2,1.1,105,24,0.3,null],
  // ── Món ăn (composite — approximate) ───────────────────────────────────────
  ["pho-bo","Phở bò","Beef pho","Món ăn",0,"tô",500, 86,5,11,2.4,0.4,440,12,1,40],
  ["com-tam-suon","Cơm tấm sườn","Broken rice w/ pork","Món ăn",0,"dĩa",400, 165,8,20,5.9,0.6,400,15,1,35],
  ["bun-bo","Bún bò Huế","Bun bo Hue","Món ăn",0,"tô",450, 107,6.2,13,3.1,0.5,500,14,1.1,40],
  ["banh-mi-thit","Bánh mì thịt","Banh mi","Món ăn",0,"ổ",160, 250,11,31,9,2,520,30,2,30],
  ["com-ga","Cơm gà","Chicken rice","Món ăn",0,"dĩa",400, 170,9,22,5,0.6,350,12,1,40],
  ["bun-cha","Bún chả","Bun cha","Món ăn",0,"phần",400, 145,9,15,5.5,0.6,450,18,1.2,45],
  ["goi-cuon","Gỏi cuốn","Fresh spring roll","Món ăn",0,"cuốn",80, 110,6,15,2.5,1,300,20,0.8,35],
  ["cha-gio","Chả giò (nem rán)","Fried spring roll","Món ăn",0,"cuốn",40, 230,8,22,12,1.5,400,25,1.3,40],
  ["banh-xeo","Bánh xèo","Banh xeo","Món ăn",0,"cái",150, 200,6,20,11,1.2,350,20,1.5,30],
  ["hu-tieu","Hủ tiếu","Hu tieu","Món ăn",0,"tô",450, 95,5,14,2,0.5,450,12,0.9,35],
  ["mi-quang","Mì Quảng","Mi Quang","Món ăn",0,"tô",450, 120,6,16,3.5,0.6,480,15,1,40],
  ["canh-chua","Canh chua","Sour soup","Món ăn",0,"tô",350, 45,3,5,1.5,0.8,400,20,0.7,30],
  ["bun-rieu","Bún riêu","Bun rieu","Món ăn",0,"tô",450, 90,5,12,2.5,0.6,500,40,1.2,50],
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
