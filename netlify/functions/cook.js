// Proxy for the Fridge Chef app. Keeps ANTHROPIC_API_KEY off the client and
// caps cost per request (small image, small output, cheap model).
const MODEL = "claude-haiku-4-5-20251001";
const MAX_IMAGE_B64 = 600_000; // ~450KB after client downscale; rejects oversized uploads

const SYSTEM = `You are Fridge Chef, a friendly cooking coach for total beginners.
Return ONLY valid JSON, no prose, no markdown fences, with this shape:
{"ingredients":[{"name":"eggs","emoji":"🥚"}],
 "recipes":[{"title":"","emoji":"","time_min":15,"difficulty":"Easy","calories":450,
   "missing":["optional items not in the photo"],
   "ingredients":[{"item":"","amount":""}],
   "steps":[{"text":"","timer_sec":0}],
   "tip":""}]}
Rules: give exactly 4 recipes, ordered fastest first. Build them mostly from the detected ingredients;
assume only salt, pepper, cooking oil and water are available. Keep "missing" to at most 2 cheap items.
Steps are short, specific, beginner-safe (say heat level, what "done" looks like). timer_sec is 0 when no timer is needed.
Only list food you can actually see. If the image has no food, return {"ingredients":[],"recipes":[]}.
Respect the user's diet and time limit.`;

const json = (status, body) => ({
  statusCode: status,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "POST only" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json(503, { error: "not_configured" });

  let req;
  try { req = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "bad_json" }); }

  const diet = String(req.diet || "none").slice(0, 40);
  const maxTime = Math.min(120, Math.max(5, Number(req.maxTime) || 45));
  const prefs = `Diet: ${diet}. Max cooking time: ${maxTime} minutes.`;

  let content;
  if (req.image) {
    if (typeof req.image !== "string" || req.image.length > MAX_IMAGE_B64) return json(413, { error: "image_too_large" });
    content = [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: req.image } },
      { type: "text", text: `Identify the food in this photo and write recipes. ${prefs}` },
    ];
  } else if (Array.isArray(req.ingredients) && req.ingredients.length) {
    const list = req.ingredients.slice(0, 40).map((s) => String(s).slice(0, 40)).join(", ");
    content = [{ type: "text", text: `I have: ${list}. Write recipes. ${prefs} Return the same ingredients array.` }];
  } else {
    return json(400, { error: "no_input" });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 2800, system: SYSTEM, messages: [{ role: "user", content }] }),
    });
    if (!r.ok) return json(502, { error: "upstream", status: r.status });
    const data = await r.json();
    const text = (data.content || []).map((b) => b.text || "").join("");
    const start = text.indexOf("{"), end = text.lastIndexOf("}");
    const parsed = JSON.parse(text.slice(start, end + 1));
    return json(200, parsed);
  } catch (e) {
    return json(502, { error: "parse_or_network" });
  }
};
