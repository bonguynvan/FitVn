/**
 * FitVN — Supabase database types (hand-written, kept in sync with
 * supabase/migrations/0001_initial_schema.sql).
 *
 * Shape follows the Supabase convention so it can be passed to
 * createClient<Database>() and so generated types could later replace it
 * without changing call sites:
 *
 *   { public: { Tables: { <table>: { Row, Insert, Update } }, Enums: {...} } }
 *
 * Row     = shape returned by SELECT.
 * Insert  = shape accepted by INSERT (optional = has default / nullable).
 * Update  = shape accepted by UPDATE (all optional).
 */

// -----------------------------------------------------------------------------
// Enum string literal unions (mirror the Postgres ENUM types)
// -----------------------------------------------------------------------------
export type GoalType = 'lose_fat' | 'gain_muscle' | 'maintain';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

export type SexType = 'male' | 'female' | 'other';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'glutes'
  | 'core'
  | 'full_body'
  | 'cardio';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// -----------------------------------------------------------------------------
// Database interface
// -----------------------------------------------------------------------------
export interface Database {
  public: {
    Tables: {
      // ---------------------------------------------------------------------
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          goal: GoalType | null;
          height_cm: number | null;
          weight_kg: number | null;
          activity_level: ActivityLevel | null;
          date_of_birth: string | null; // date (ISO yyyy-mm-dd)
          sex: SexType | null;
          daily_calorie_target: number | null;
          protein_target_g: number | null;
          carbs_target_g: number | null;
          fat_target_g: number | null;
          is_premium: boolean;
          created_at: string; // timestamptz (ISO)
          updated_at: string;
        };
        Insert: {
          id: string; // must equal auth.users.id
          full_name?: string | null;
          avatar_url?: string | null;
          goal?: GoalType | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          activity_level?: ActivityLevel | null;
          date_of_birth?: string | null;
          sex?: SexType | null;
          daily_calorie_target?: number | null;
          protein_target_g?: number | null;
          carbs_target_g?: number | null;
          fat_target_g?: number | null;
          is_premium?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          goal?: GoalType | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          activity_level?: ActivityLevel | null;
          date_of_birth?: string | null;
          sex?: SexType | null;
          daily_calorie_target?: number | null;
          protein_target_g?: number | null;
          carbs_target_g?: number | null;
          fat_target_g?: number | null;
          is_premium?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ---------------------------------------------------------------------
      exercises: {
        Row: {
          id: string;
          name_vi: string;
          name_en: string | null;
          muscle_group: MuscleGroup;
          equipment: string | null;
          instructions_vi: string | null;
          video_url: string | null;
          is_custom: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name_vi: string;
          name_en?: string | null;
          muscle_group: MuscleGroup;
          equipment?: string | null;
          instructions_vi?: string | null;
          video_url?: string | null;
          is_custom?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name_vi?: string;
          name_en?: string | null;
          muscle_group?: MuscleGroup;
          equipment?: string | null;
          instructions_vi?: string | null;
          video_url?: string | null;
          is_custom?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      // ---------------------------------------------------------------------
      workout_plans: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          days_per_week: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          days_per_week?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          days_per_week?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };

      // ---------------------------------------------------------------------
      plan_exercises: {
        Row: {
          id: string;
          plan_id: string;
          day_of_week: number; // 1-7
          exercise_id: string;
          target_sets: number | null;
          target_reps: number | null;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          day_of_week: number;
          exercise_id: string;
          target_sets?: number | null;
          target_reps?: number | null;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          day_of_week?: number;
          exercise_id?: string;
          target_sets?: number | null;
          target_reps?: number | null;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [];
      };

      // ---------------------------------------------------------------------
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string | null;
          performed_on: string; // date
          started_at: string | null; // timestamptz
          duration_min: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id?: string | null;
          performed_on?: string;
          started_at?: string | null;
          duration_min?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string | null;
          performed_on?: string;
          started_at?: string | null;
          duration_min?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      // ---------------------------------------------------------------------
      session_exercises: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          set_number: number;
          reps: number | null;
          weight_kg: number | null;
          rpe: number | null;
          notes: string | null;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_id: string;
          set_number?: number;
          reps?: number | null;
          weight_kg?: number | null;
          rpe?: number | null;
          notes?: string | null;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          exercise_id?: string;
          set_number?: number;
          reps?: number | null;
          weight_kg?: number | null;
          rpe?: number | null;
          notes?: string | null;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [];
      };

      // ---------------------------------------------------------------------
      foods: {
        Row: {
          id: string;
          name_vi: string;
          name_en: string | null;
          brand: string | null;
          serving_desc: string | null;
          calories_per_100g: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          fiber_g: number | null;
          is_vietnamese: boolean;
          is_verified: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name_vi: string;
          name_en?: string | null;
          brand?: string | null;
          serving_desc?: string | null;
          calories_per_100g: number;
          protein_g?: number;
          carbs_g?: number;
          fat_g?: number;
          fiber_g?: number | null;
          is_vietnamese?: boolean;
          is_verified?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name_vi?: string;
          name_en?: string | null;
          brand?: string | null;
          serving_desc?: string | null;
          calories_per_100g?: number;
          protein_g?: number;
          carbs_g?: number;
          fat_g?: number;
          fiber_g?: number | null;
          is_vietnamese?: boolean;
          is_verified?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      // ---------------------------------------------------------------------
      nutrition_logs: {
        Row: {
          id: string;
          user_id: string;
          logged_on: string; // date
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          logged_on?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          logged_on?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      // ---------------------------------------------------------------------
      log_items: {
        Row: {
          id: string;
          log_id: string;
          food_id: string;
          meal_type: MealType;
          quantity: number;
          unit: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          log_id: string;
          food_id: string;
          meal_type: MealType;
          quantity: number;
          unit?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          log_id?: string;
          food_id?: string;
          meal_type?: MealType;
          quantity?: number;
          unit?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      // ---------------------------------------------------------------------
      body_measurements: {
        Row: {
          id: string;
          user_id: string;
          measured_on: string; // date
          weight_kg: number | null;
          body_fat_pct: number | null;
          waist_cm: number | null;
          chest_cm: number | null;
          hip_cm: number | null;
          arm_cm: number | null;
          thigh_cm: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          measured_on?: string;
          weight_kg?: number | null;
          body_fat_pct?: number | null;
          waist_cm?: number | null;
          chest_cm?: number | null;
          hip_cm?: number | null;
          arm_cm?: number | null;
          thigh_cm?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          measured_on?: string;
          weight_kg?: number | null;
          body_fat_pct?: number | null;
          waist_cm?: number | null;
          chest_cm?: number | null;
          hip_cm?: number | null;
          arm_cm?: number | null;
          thigh_cm?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      // ---------------------------------------------------------------------
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };

    Views: Record<string, never>;

    Functions: Record<string, never>;

    Enums: {
      goal_type: GoalType;
      activity_level: ActivityLevel;
      sex_type: SexType;
      muscle_group: MuscleGroup;
      meal_type: MealType;
    };

    CompositeTypes: Record<string, never>;
  };
}

// -----------------------------------------------------------------------------
// Convenience aliases — Row / Insert / Update per table
// -----------------------------------------------------------------------------
type PublicTables = Database['public']['Tables'];

export type Profile = PublicTables['profiles']['Row'];
export type ProfileInsert = PublicTables['profiles']['Insert'];
export type ProfileUpdate = PublicTables['profiles']['Update'];

export type Exercise = PublicTables['exercises']['Row'];
export type ExerciseInsert = PublicTables['exercises']['Insert'];
export type ExerciseUpdate = PublicTables['exercises']['Update'];

export type WorkoutPlan = PublicTables['workout_plans']['Row'];
export type WorkoutPlanInsert = PublicTables['workout_plans']['Insert'];
export type WorkoutPlanUpdate = PublicTables['workout_plans']['Update'];

export type PlanExercise = PublicTables['plan_exercises']['Row'];
export type PlanExerciseInsert = PublicTables['plan_exercises']['Insert'];
export type PlanExerciseUpdate = PublicTables['plan_exercises']['Update'];

export type WorkoutSession = PublicTables['workout_sessions']['Row'];
export type WorkoutSessionInsert = PublicTables['workout_sessions']['Insert'];
export type WorkoutSessionUpdate = PublicTables['workout_sessions']['Update'];

export type SessionExercise = PublicTables['session_exercises']['Row'];
export type SessionExerciseInsert = PublicTables['session_exercises']['Insert'];
export type SessionExerciseUpdate = PublicTables['session_exercises']['Update'];

export type Food = PublicTables['foods']['Row'];
export type FoodInsert = PublicTables['foods']['Insert'];
export type FoodUpdate = PublicTables['foods']['Update'];

export type NutritionLog = PublicTables['nutrition_logs']['Row'];
export type NutritionLogInsert = PublicTables['nutrition_logs']['Insert'];
export type NutritionLogUpdate = PublicTables['nutrition_logs']['Update'];

export type LogItem = PublicTables['log_items']['Row'];
export type LogItemInsert = PublicTables['log_items']['Insert'];
export type LogItemUpdate = PublicTables['log_items']['Update'];

export type BodyMeasurement = PublicTables['body_measurements']['Row'];
export type BodyMeasurementInsert = PublicTables['body_measurements']['Insert'];
export type BodyMeasurementUpdate = PublicTables['body_measurements']['Update'];

export type PushSubscription = PublicTables['push_subscriptions']['Row'];
export type PushSubscriptionInsert = PublicTables['push_subscriptions']['Insert'];
export type PushSubscriptionUpdate = PublicTables['push_subscriptions']['Update'];
