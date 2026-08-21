import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().split("T")[0];

    // Check if today's challenge already exists
    const { data: existing } = await supabase
      .from("daily_challenges")
      .select("date, passage_id, mode, difficulty, duration_seconds")
      .eq("date", today)
      .maybeSingle();

    if (existing) {
      // Return existing challenge with passage content
      const { data: passage } = await supabase
        .from("passages")
        .select("content, difficulty, category")
        .eq("id", existing.passage_id)
        .maybeSingle();

      return new Response(JSON.stringify({ challenge: existing, passage }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a new daily challenge
    // Rotate difficulty based on day of week for variety
    const dayOfWeek = new Date().getDay();
    const difficulties = ["easy", "medium", "medium", "hard", "medium", "hard", "expert"];
    const difficulty = difficulties[dayOfWeek];
    const modes = ["time", "words", "quote"];
    const mode = modes[dayOfWeek % modes.length];
    const durations = [60, 50, 60, 45, 60, 40, 60];
    const duration = durations[dayOfWeek];

    // Pick a random passage matching the difficulty
    const { data: passages } = await supabase
      .from("passages")
      .select("id, content")
      .eq("difficulty", difficulty)
      .order("random()")
      .limit(1);

    if (!passages || passages.length === 0) {
      return new Response(JSON.stringify({ error: "No passages available" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const passage = passages[0];

    const { data: challenge, error } = await supabase
      .from("daily_challenges")
      .insert({
        date: today,
        passage_id: passage.id,
        mode,
        difficulty,
        duration_seconds: duration,
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ challenge, passage: { content: passage.content, difficulty, category: "daily" } }), {
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
