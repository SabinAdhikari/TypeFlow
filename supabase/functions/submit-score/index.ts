import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ScoreSubmission {
  wpm: number;
  cpm: number;
  accuracy: number;
  score: number;
  correct_chars: number;
  incorrect_chars: number;
  total_chars: number;
  errors: number;
  duration_seconds: number;
  words_typed: number;
  mode: string;
  difficulty: string;
  is_daily: boolean;
  challenge_date: string | null;
  raw_text: string;
  typed_text: string;
}

// Server-side WPM recalculation: WPM = (correct_chars / 5) / time_in_minutes
function calculateWPM(correctChars: number, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  return (correctChars / 5) / (durationSeconds / 60);
}

// Server-side score: rewards speed AND accuracy, penalizes errors
function calculateScore(wpm: number, accuracy: number, errors: number): number {
  const accuracyFactor = Math.pow(accuracy / 100, 2);
  const errorPenalty = Math.min(errors * 2, wpm * 0.5);
  return Math.max(0, Math.round(wpm * accuracyFactor * 10 - errorPenalty));
}

// Anti-cheat: detect impossible typing speeds
// World record is ~216 WPM on a standard keyboard; anything above 300 is almost certainly cheating
const MAX_PLAUSIBLE_WPM = 300;
// Minimum plausible duration (avoid instant submissions)
const MIN_DURATION_SECONDS = 1;
// Maximum plausible CPM per WPM ratio (should be ~5)
const MAX_CPM_WPM_RATIO = 8;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: userData, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // Check if user is suspended
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_suspended")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.is_suspended) {
      return new Response(JSON.stringify({ error: "Account suspended" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: ScoreSubmission = await req.json();

    // --- Anti-cheat validation ---

    // 1. Duration check
    if (body.duration_seconds < MIN_DURATION_SECONDS) {
      return new Response(JSON.stringify({ error: "Duration too short" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Recalculate WPM server-side
    const serverWPM = calculateWPM(body.correct_chars, body.duration_seconds);

    // 3. Check for impossible WPM
    if (serverWPM > MAX_PLAUSIBLE_WPM) {
      return new Response(JSON.stringify({ error: "Impossible typing speed detected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Verify client WPM matches server calculation (within tolerance)
    if (Math.abs(body.wpm - serverWPM) > 5) {
      return new Response(JSON.stringify({ error: "WPM mismatch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Verify CPM/WPM ratio
    if (body.wpm > 0 && body.cpm / body.wpm > MAX_CPM_WPM_RATIO) {
      return new Response(JSON.stringify({ error: "Invalid CPM/WPM ratio" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Verify accuracy is plausible
    if (body.accuracy < 0 || body.accuracy > 100) {
      return new Response(JSON.stringify({ error: "Invalid accuracy" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 7. Verify total chars matches typed text length
    if (body.total_chars !== body.typed_text.length) {
      return new Response(JSON.stringify({ error: "Character count mismatch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 8. Verify correct + incorrect = total
    if (body.correct_chars + body.incorrect_chars !== body.total_chars) {
      return new Response(JSON.stringify({ error: "Character breakdown mismatch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 9. Rate limiting: check recent submissions (max 1 per 10 seconds)
    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
    const { count: recentCount } = await supabase
      .from("test_results")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", tenSecondsAgo);

    if (recentCount && recentCount >= 2) {
      return new Response(JSON.stringify({ error: "Rate limit: too many submissions" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 10. Daily challenge validation: verify the challenge exists and matches
    if (body.is_daily && body.challenge_date) {
      const { data: challenge } = await supabase
        .from("daily_challenges")
        .select("date, mode, difficulty, duration_seconds")
        .eq("date", body.challenge_date)
        .maybeSingle();

      if (!challenge) {
        return new Response(JSON.stringify({ error: "Daily challenge not found" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if user already completed today's challenge
      const { data: existingDaily } = await supabase
        .from("test_results")
        .select("id")
        .eq("user_id", userId)
        .eq("is_daily", true)
        .eq("challenge_date", body.challenge_date)
        .maybeSingle();

      if (existingDaily) {
        return new Response(JSON.stringify({ error: "Daily challenge already completed" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // --- Recalculate score server-side ---
    const serverScore = calculateScore(serverWPM, body.accuracy, body.errors);
    const serverCPM = Math.round(serverWPM * 5);

    // --- Insert the validated result ---
    const { data: result, error: insertError } = await supabase
      .from("test_results")
      .insert({
        user_id: userId,
        wpm: serverWPM,
        cpm: serverCPM,
        accuracy: body.accuracy,
        score: serverScore,
        correct_chars: body.correct_chars,
        incorrect_chars: body.incorrect_chars,
        total_chars: body.total_chars,
        errors: body.errors,
        duration_seconds: body.duration_seconds,
        words_typed: body.words_typed,
        mode: body.mode,
        difficulty: body.difficulty,
        is_daily: body.is_daily,
        challenge_date: body.challenge_date,
      })
      .select()
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: "Failed to save result" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Check and award achievements ---
    await checkAchievements(supabase, userId, serverWPM, body.accuracy, body.duration_seconds, body.is_daily);

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function checkAchievements(
  supabase: any,
  userId: string,
  wpm: number,
  accuracy: number,
  durationSeconds: number,
  isDaily: boolean
) {
  // Get user's aggregate stats
  const { data: stats } = await supabase
    .from("test_results")
    .select("wpm, accuracy, duration_seconds, created_at, is_daily")
    .eq("user_id", userId);

  if (!stats || stats.length === 0) return;

  const totalTests = stats.length;
  const bestWPM = Math.max(...stats.map((s: any) => Number(s.wpm)));
  const bestAccuracy = Math.max(...stats.map((s: any) => Number(s.accuracy)));
  const totalTime = stats.reduce((sum: number, s: any) => sum + Number(s.duration_seconds), 0);
  const dailyCount = stats.filter((s: any) => s.is_daily).length;

  // Calculate streak (consecutive days with at least one test)
  const dates = [...new Set(stats.map((s: any) => new Date(s.created_at).toDateString()))];
  dates.sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
  let streak = 0;
  let today = new Date();
  for (const d of dates) {
    const diff = Math.floor((today.getTime() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
    if (diff === streak) {
      streak++;
    } else if (diff > streak) {
      break;
    }
  }

  // Get all achievement definitions
  const { data: allAchievements } = await supabase.from("achievements").select("key, category, threshold");

  // Get user's existing achievements
  const { data: existing } = await supabase
    .from("user_achievements")
    .select("achievement_key")
    .eq("user_id", userId);
  const existingKeys = new Set((existing || []).map((e: any) => e.achievement_key));

  const toUnlock: { key: string }[] = [];

  for (const ach of allAchievements || []) {
    if (existingKeys.has(ach.key)) continue;
    let unlocked = false;
    switch (ach.category) {
      case "volume":
        unlocked = totalTests >= ach.threshold;
        break;
      case "speed":
        unlocked = bestWPM >= ach.threshold;
        break;
      case "accuracy":
        unlocked = bestAccuracy >= ach.threshold;
        break;
      case "time":
        unlocked = totalTime >= ach.threshold;
        break;
      case "streak":
        unlocked = streak >= ach.threshold;
        break;
      case "daily":
        unlocked = dailyCount >= ach.threshold;
        break;
      case "rank":
        // Handled separately via leaderboard position; skip here
        break;
    }
    if (unlocked) toUnlock.push({ key: ach.key });
  }

  if (toUnlock.length > 0) {
    const inserts = toUnlock.map((t) => ({ user_id: userId, achievement_key: t.key }));
    await supabase.from("user_achievements").insert(inserts);
  }
}
