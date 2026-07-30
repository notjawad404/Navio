import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TRIPS_TABLE    = process.env.TRIPS_TABLE
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const BASE_URL       = "https://generativelanguage.googleapis.com/v1beta/models"

// All confirmed-working models — fired in parallel, first to succeed wins
const MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-flash-latest",
  "gemini-3-flash-preview",
  "gemini-flash-lite-latest",
]

// Canonical slot ids — the frontend maps these to a label, icon and colour
const SLOT_KEYS = [
  "early-morning",
  "morning",
  "midday",
  "afternoon",
  "late-afternoon",
  "evening",
  "night",
]

const CORS = {
  "Access-Control-Allow-Origin":  "http://localhost:5173",
  "Access-Control-Allow-Headers": "content-type,authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
}

const res = (code, body) => ({
  statusCode: code,
  headers: { "Content-Type": "application/json", ...CORS },
  body: JSON.stringify(body),
})

// Enforced server-side by Gemini so the shape can't drift between models
const PLACE_SCHEMA = {
  type: "object",
  properties: {
    place:       { type: "string", description: "Exact venue name" },
    activity:    { type: "string", description: "What the traveller does here" },
    description: { type: "string", description: "1-2 sentences on what to expect" },
    startTime:   { type: "string", description: "24-hour HH:MM arrival time" },
    endTime:     { type: "string", description: "24-hour HH:MM departure time" },
    duration:    { type: "string", description: "Human-readable stay, e.g. '1h 30m'" },
    lat:         { type: "number" },
    lng:         { type: "number" },
    travelToNext: {
      type: "object",
      description: "How to reach the next place. Omit on the last place of the day.",
      properties: {
        mode:    { type: "string", description: "Walk, Metro, Bus, Taxi, Train or Ferry" },
        minutes: { type: "integer" },
      },
      required: ["mode", "minutes"],
      propertyOrdering: ["mode", "minutes"],
    },
  },
  required: ["place", "activity", "description", "startTime", "endTime", "duration", "lat", "lng"],
  propertyOrdering: [
    "place", "activity", "description", "startTime", "endTime",
    "duration", "lat", "lng", "travelToNext",
  ],
}

const PLAN_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    days: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day:   { type: "integer" },
          theme: { type: "string" },
          slots: {
            type: "array",
            minItems: 5,
            maxItems: 7,
            items: {
              type: "object",
              properties: {
                slot:   { type: "string", enum: SLOT_KEYS },
                title:  { type: "string", description: "Short heading for this block" },
                places: { type: "array", minItems: 1, maxItems: 3, items: PLACE_SCHEMA },
              },
              required: ["slot", "title", "places"],
              propertyOrdering: ["slot", "title", "places"],
            },
          },
          tips: { type: "string" },
        },
        required: ["day", "theme", "slots", "tips"],
        propertyOrdering: ["day", "theme", "slots", "tips"],
      },
    },
    generalTips:   { type: "array", minItems: 3, maxItems: 6, items: { type: "string" } },
    estimatedCost: { type: "string" },
  },
  required: ["summary", "days", "generalTips", "estimatedCost"],
  propertyOrdering: ["summary", "days", "generalTips", "estimatedCost"],
}

function buildPrompt(trip) {
  return `You are an expert local travel planner. Build a realistic, hour-by-hour itinerary that a real person could actually follow.

Trip details:
- Destination: ${trip.destination}
- Duration: ${trip.days} days
- Budget level: ${trip.budget}
- Travel style: ${trip.travelStyle}
- Interests: ${(trip.interests || []).join(", ") || "general sightseeing"}
${trip.notes ? `- Special notes: ${trip.notes}` : ""}

PLANNING RULES — every one of them matters:

1. Time slots — cover the whole day
   - Give each day 5 to 7 slots. Never fall back to just morning / afternoon / evening.
   - Fill the real waking day: first slot starts between 07:30 and 09:00, last slot ends between 21:00 and 23:00.
   - Slots run in chronological order and must never overlap.
   - Set each slot's "slot" field to one of: ${SLOT_KEYS.join(", ")}.
   - The same slot id may appear twice in a day (e.g. two "afternoon" blocks) as long as the times stay sequential.

2. Several places in one slot
   - A slot holds 1 to 3 places. Use 2 or 3 whenever the stops are within about a 10-minute walk of each other, so they can be combined without transit — a temple plus the market street beside it, a museum plus the café across the square.
   - If reaching the next place takes more than roughly 15 minutes, do NOT bolt it onto the current slot. Start a new slot.

3. Honest dwell time — this is the most important rule
   - Give every place the time it genuinely deserves before moving on:
     · major museum, gallery or theme park: 2-4 hours
     · temple, shrine, castle, major landmark: 45-90 minutes
     · viewpoint, monument or photo stop: 20-40 minutes
     · market or shopping street: 1-2 hours
     · park or garden walk: 45-90 minutes
     · sit-down meal: 60-90 minutes | casual or street food: 30-45 minutes | café stop: 30-45 minutes
     · guided tour, show or class: its real running time
   - Never schedule a large famous attraction as a 30-minute stop. Fewer places done properly beats a checklist.

4. Travel time must add up
   - Give every place except the last one of the day a "travelToNext" with a realistic mode and minutes for THIS city.
   - The next place's startTime must be at least the previous endTime plus that travel time. Do the arithmetic and keep it consistent.
   - "duration" must match the gap between that place's own startTime and endTime.

5. A day a real person can survive
   - Anchor each day on one neighbourhood or district. Do not zig-zag back and forth across the city.
   - Include breakfast, lunch and dinner as real stops at named venues, not vague suggestions.
   - Leave a café, rest or downtime stop on heavy sightseeing days.
   - Cap it at 5-7 substantial sights per day; the rest should be meals, breaks and short stops.

6. Coordinates
   - "lat" and "lng" must be accurate real-world coordinates for that exact venue — not the city centre, not an approximation.

All times use 24-hour "HH:MM" format. Keep each "description" to 1-2 sentences.

Return ONLY a valid JSON object — no markdown, no code block, no commentary — shaped like this:
{
  "summary": "2-3 sentence overview of the trip experience",
  "days": [
    {
      "day": 1,
      "theme": "Short catchy theme for this day",
      "slots": [
        {
          "slot": "morning",
          "title": "Short heading for this block",
          "places": [
            {
              "place": "Exact venue name",
              "activity": "What to do there",
              "description": "1-2 sentences on what to expect",
              "startTime": "09:00",
              "endTime": "10:30",
              "duration": "1h 30m",
              "lat": 0.0,
              "lng": 0.0,
              "travelToNext": { "mode": "Walk", "minutes": 8 }
            }
          ]
        }
      ],
      "tips": "One practical tip specific to this day"
    }
  ],
  "generalTips": ["tip 1", "tip 2", "tip 3", "tip 4"],
  "estimatedCost": "Brief per-person cost estimate for ${trip.budget} budget traveller"
}`
}

async function tryModel(model, prompt, signal) {
  try {
    const r = await fetch(`${BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema:   PLAN_SCHEMA,
          // A 5-7 slot day with up to 3 places each is far larger than the old
          // 3-slot plan — the default cap truncates anything past ~4 days.
          maxOutputTokens:  32768,
        },
      }),
    })

    const data = await r.json()
    if (!r.ok) throw new Error(`${r.status} ${data.error?.status}`)

    const candidate = data.candidates?.[0]
    // Truncated output is unparseable JSON — lose this racer instead of poisoning the winner
    if (candidate?.finishReason === "MAX_TOKENS") throw new Error("response truncated")

    const parts = candidate?.content?.parts ?? []
    const text  = parts.find(p => !p.thought)?.text ?? parts[0]?.text
    if (!text) throw new Error("empty response")

    return { model, text }
  } catch (err) {
    const reason = err.name === "AbortError" ? "aborted" : err.message
    console.log(`[${model}] failed: ${reason}`)
    throw err
  }
}

async function callGemini(prompt) {
  // One AbortController per model + a shared 20s global timeout
  // Richer plans take longer to generate; stay under the API Gateway integration ceiling
  const controllers = MODELS.map(() => new AbortController())
  const globalTimer = setTimeout(() => {
    controllers.forEach(c => c.abort())
  }, 25000)

  try {
    const { model, text } = await Promise.any(
      MODELS.map((m, i) => tryModel(m, prompt, controllers[i].signal))
    )
    // Cancel all remaining in-flight requests immediately
    controllers.forEach(c => c.abort())
    clearTimeout(globalTimer)
    console.log(`Winner: ${model}`)
    return text
  } catch {
    clearTimeout(globalTimer)
    return null  // AggregateError — all models failed or timed out
  }
}

export const handler = async (event) => {
  const userId = event.requestContext.authorizer.jwt.claims.sub
  const { tripId } = event.pathParameters || {}

  console.log(`Generating plan for trip: ${tripId}`)

  try {
    const result = await db.send(new GetCommand({ TableName: TRIPS_TABLE, Key: { tripId } }))
    if (!result.Item) return res(404, { message: "Trip not found" })
    if (result.Item.userId !== userId) return res(403, { message: "Forbidden" })

    console.log(`Trip found: ${result.Item.destination}, ${result.Item.days} days`)

    const raw = await callGemini(buildPrompt(result.Item))
    if (!raw) return res(502, { message: "All AI models are currently busy. Please try again in a moment." })

    const start = raw.indexOf('{')
    const end   = raw.lastIndexOf('}')
    if (start === -1 || end === -1) return res(502, { message: "AI returned malformed response." })

    let plan
    try {
      plan = JSON.parse(raw.slice(start, end + 1))
    } catch {
      console.error(`Unparseable plan (${raw.length} chars) for trip: ${tripId}`)
      return res(502, { message: "AI returned an incomplete itinerary. Please try again." })
    }

    await db.send(new UpdateCommand({
      TableName: TRIPS_TABLE,
      Key: { tripId },
      UpdateExpression: "SET aiPlan = :plan, updatedAt = :now",
      ExpressionAttributeValues: {
        ":plan": plan,
        ":now": new Date().toISOString(),
      },
    }))

    console.log(`Plan saved for trip: ${tripId}`)
    return res(200, { tripId, plan })
  } catch (err) {
    console.error("Handler error:", err)
    return res(500, { message: err.message || "Internal server error" })
  }
}
