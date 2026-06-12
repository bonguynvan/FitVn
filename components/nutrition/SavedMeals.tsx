"use client";

import { useState } from "react";
import { Check, ChevronRight, Pencil, Plus, Trash2, UtensilsCrossed } from "lucide-react";

import { Card, EmptyState, SectionHeader, Sheet } from "@/components/ui";
import { MealBuilder } from "@/components/nutrition/MealBuilder";
import { defaultMealByHour } from "@/lib/nutrition/meal-time";
import { addManyFoods } from "@/lib/store/nutrition-store";
import {
  mealCalories,
  removeSavedMeal,
  useSavedMeals,
  type SavedMeal,
} from "@/lib/store/meal-store";

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");

/** "Bữa của tôi" — saved meals you can log in one tap, plus a builder. */
export function SavedMeals({ dateIso }: { dateIso: string }) {
  const meals = useSavedMeals();
  const [building, setBuilding] = useState(false);
  const [editingMeal, setEditingMeal] = useState<SavedMeal | null>(null);
  const [loggedId, setLoggedId] = useState<string | null>(null);
  const sheetOpen = building || editingMeal != null;

  function logMeal(meal: SavedMeal) {
    const mealType = defaultMealByHour();
    addManyFoods(
      dateIso,
      meal.items.map((i) => ({ ...i, mealType })),
    );
    setLoggedId(meal.id);
    setTimeout(() => setLoggedId((id) => (id === meal.id ? null : id)), 1500);
  }

  return (
    <section aria-labelledby="saved-meals-heading" className="flex flex-col gap-3">
      <SectionHeader
        id="saved-meals-heading"
        action={
          <button
            type="button"
            onClick={() => setBuilding(true)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary active:scale-95"
          >
            <Plus size={16} aria-hidden /> Tạo bữa
          </button>
        }
      >
        Bữa của tôi
      </SectionHeader>

      {meals.length === 0 ? (
        <EmptyState
          size="sm"
          icon={UtensilsCrossed}
          description="Tạo bữa quen thuộc để ghi nhanh chỉ với một chạm."
        />
      ) : (
        <Card padding="md">
          <ul className="flex flex-col divide-y divide-border">
            {meals.map((meal) => {
              const logged = loggedId === meal.id;
              return (
                <li key={meal.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text">{meal.name}</p>
                    <p className="text-xs text-muted">
                      {meal.items.length} món · {fmt(mealCalories(meal))} kcal
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => logMeal(meal)}
                    className={`inline-flex h-8 items-center gap-1 rounded-btn px-3 text-xs font-semibold transition-colors active:scale-95 ${
                      logged
                        ? "bg-success/15 text-success"
                        : "bg-primary text-primary-fg shadow-glow"
                    }`}
                  >
                    {logged ? (
                      <>
                        <Check size={14} /> Đã ghi
                      </>
                    ) : (
                      <>
                        Ghi <ChevronRight size={14} />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingMeal(meal)}
                    aria-label={`Sửa bữa ${meal.name}`}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-btn text-muted transition hover:bg-surface-raised hover:text-text"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSavedMeal(meal.id)}
                    aria-label={`Xóa bữa ${meal.name}`}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-btn text-muted transition hover:bg-surface-raised hover:text-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Sheet
        open={sheetOpen}
        onClose={() => {
          setBuilding(false);
          setEditingMeal(null);
        }}
        title={editingMeal ? "Sửa bữa" : "Tạo bữa mới"}
      >
        {sheetOpen ? (
          <MealBuilder
            key={editingMeal?.id ?? "new"}
            editing={editingMeal ?? undefined}
            onDone={() => {
              setBuilding(false);
              setEditingMeal(null);
            }}
          />
        ) : null}
      </Sheet>
    </section>
  );
}
