/** A preset workout template definition (static, ships with the app). */
export interface WorkoutTemplateDef {
  id: string;
  name: string;
  exercises: { name: string; setCount: number }[];
}

/** Built-in quick-start templates. Vietnamese names, sensible set counts. */
export const PRESET_TEMPLATES: ReadonlyArray<WorkoutTemplateDef> = [
  {
    id: "preset-push",
    name: "Đẩy (Ngực · Vai · Tay sau)",
    exercises: [
      { name: "Đẩy ngực với tạ đòn", setCount: 4 },
      { name: "Đẩy ngực dốc với tạ đơn", setCount: 3 },
      { name: "Đẩy vai (Overhead Press)", setCount: 3 },
      { name: "Nâng tạ ngang vai (Lateral Raise)", setCount: 3 },
      { name: "Duỗi tay sau với dây cáp", setCount: 3 },
    ],
  },
  {
    id: "preset-pull",
    name: "Kéo (Lưng · Tay trước)",
    exercises: [
      { name: "Kéo xà (Pull-up)", setCount: 4 },
      { name: "Kéo cáp ngồi (Seated Row)", setCount: 3 },
      { name: "Kéo xô (Lat Pulldown)", setCount: 3 },
      { name: "Cuốn tạ đòn (Barbell Curl)", setCount: 3 },
      { name: "Cuốn tạ búa (Hammer Curl)", setCount: 3 },
    ],
  },
  {
    id: "preset-legs",
    name: "Chân (Mông · Đùi)",
    exercises: [
      { name: "Squat với tạ đòn", setCount: 4 },
      { name: "Đẩy chân (Leg Press)", setCount: 3 },
      { name: "Nâng tạ kiểu Romania (RDL)", setCount: 3 },
      { name: "Duỗi đùi trước (Leg Extension)", setCount: 3 },
      { name: "Nâng bắp chân (Calf Raise)", setCount: 4 },
    ],
  },
  {
    id: "preset-fullbody",
    name: "Toàn thân",
    exercises: [
      { name: "Squat với tạ đòn", setCount: 3 },
      { name: "Đẩy ngực với tạ đòn", setCount: 3 },
      { name: "Kéo cáp ngồi (Seated Row)", setCount: 3 },
      { name: "Đẩy vai (Overhead Press)", setCount: 3 },
      { name: "Plank giữ cơ bụng", setCount: 3 },
    ],
  },
];
