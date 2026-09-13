import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda"

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const lambda = new LambdaClient({})
const TRIPS_TABLE    = process.env.TRIPS_TABLE
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const BASE_URL       = "https://generativelanguage.googleapis.com/v1beta/models"

// Tried in order — the first is the primary, the rest are fallbacks
const MODELS = [
  "gemini-3-flash-preview",
  "gemini-flash-lite-latest",
  "gemini-2.5-flash-lite",
  // "gemini-3.1-flash-lite",   // thinnest plans of the lite models
  // "gemini-flash-latest",     // kept returning 503 high demand
]

// The worker's budget must stay under the Lambda timeout (540s)
const GENERATION_BUDGET_MS = 8 * 60 * 1000
const MODEL_TIMEOUT_MS     = 3 * 60 * 1000
// Past this, a "generating" status is assumed to belong to a worker that died
const STALE_AFTER_MS       = 10 * 60 * 1000

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

const BUDGET_GUIDE = {
  Budget:   "Favour free sights, street food, markets, food halls and public transport. Only pick paid attractions that are genuine must-sees.",
  Moderate: "Mix well-rated casual and sit-down restaurants with the main paid attractions and the odd splurge. Use public transport, with a taxi when it saves real time.",
  Luxury:   "Choose acclaimed restaurants, premium and skip-the-line experiences, rooftop bars and spas. Taxis and private transfers are fine.",
}

const STYLE_GUIDE = {
  Cultural:   "Lean into history, heritage, local traditions, hands-on workshops and the neighbourhoods where locals actually live, alongside the famous landmarks.",
  Adventure:  "Build in active experiences such as hikes, cycling, water sports or climbing, plus energetic, off-the-beaten-path spots.",
  Relaxation: "Keep the pace unhurried: longer dwell times, scenic spots, gardens, spas, long lunches and generous downtime between sights.",
  Romantic:   "Favour scenic viewpoints, sunset spots, intimate restaurants, evening strolls and experiences made for two.",
  Family:     "Pick kid-friendly venues, keep travel legs short, add parks, playgrounds, interactive museums and rest breaks, skip bars, and wrap up by about 21:00.",
}

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

// Enforced server-side by Gemini so the shape can't drift between models.
// No minItems/maxItems: nested array bounds exceed Gemini's schema complexity limit — counts are set in the prompt.
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
            description: "5 to 7 chronological time blocks covering the whole day",
            items: {
              type: "object",
              properties: {
                slot:   { type: "string", enum: SLOT_KEYS },
                title:  { type: "string", description: "Short heading for this block" },
                places: { type: "array", description: "1 to 3 places close enough to walk between", items: PLACE_SCHEMA },
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
    generalTips:   { type: "array", description: "4 to 6 practical tips", items: { type: "string" } },
    estimatedCost: { type: "string" },
  },
  required: ["summary", "days", "generalTips", "estimatedCost"],
  propertyOrdering: ["summary", "days", "generalTips", "estimatedCost"],
}

function interestRule(interests) {
  if (!interests.length) {
    return `   - No specific interests were chosen: give a balanced mix of landmarks, culture, food, nature and neighbourhood life.`
  }

  const showcase = `
     · Show each interest through specific venues and experiences, not labels — e.g. for food, the signature dish at a named restaurant or stall, not just "lunch".
     · Still fit in the destination's unmissable highlights, experienced through these interests where possible.
     · If an interest isn't genuinely available at this destination — e.g. Beaches in a landlocked city — leave it out rather than forcing it: no invented venues, no weak stand-ins, no long trips out of town just to tick it off. Give that time to the other choices and the destination's real strengths, and mention it in one short sentence in the summary.`

  if (interests.length === 1) {
    return `   - Interest (${interests[0]}): make it the centrepiece of every day, rounded out with the destination's essential highlights.${showcase}`
  }

  return `   - Interests (${interests.join(", ")}):
     · Blend them within each day — every day mixes at least ${Math.min(interests.length, 3)} of them where the destination allows. Never hand a whole day to a single interest.
     · Across the trip every interest the destination can genuinely offer gets solid, repeated coverage — none dominates and none is left out.${showcase}`
}

function buildPrompt(trip) {
  const interests = trip.interests || []

  return `You are an expert local travel planner. Build a detailed, hour-by-hour itinerary that a real person could actually follow and that feels made for this specific traveller.

Trip details:
- Destination: ${trip.destination}
- Duration: ${trip.days} days
- Budget level: ${trip.budget}
- Travel style: ${trip.travelStyle}
- Interests: ${interests.join(", ") || "general sightseeing"}
${trip.notes ? `- Special notes: ${trip.notes}` : ""}

PLANNING RULES — every one of them matters:

1. Tailor everything to the traveller's choices
${interestRule(interests)}
   - Travel style (${trip.travelStyle}): ${STYLE_GUIDE[trip.travelStyle] ?? "Shape the pace and venue choices around this style."}
   - Budget (${trip.budget}): ${BUDGET_GUIDE[trip.budget] ?? "Match venues, meals and transport to this budget."}
${trip.notes ? `   - The special notes are hard constraints — every stop must respect them.\n` : ""}   - Every venue, meal and transport choice should fit the interests, style and budget at the same time, and each day's "theme" should reflect that day's blend.

2. Depth — an expert plan, not a generic checklist
   - Each day has at least 5 slots and 8 to 12 places in total, meals included. A day with fewer is incomplete — keep adding stops until it isn't.
   - Use real, specific venues. Never use placeholders like "local restaurant", "nearby café" or "shopping district".
   - Mix headline sights with lesser-known spots a local would recommend.
   - Every "activity" says exactly what to do, see, order or try there — the signature dish, the exhibit not to miss, the best viewpoint.
   - Give every day a distinct theme and never repeat a venue across the trip.

3. Time slots — cover the whole day
   - Give each day 5 to 7 slots. Never fall back to just morning / afternoon / evening.
   - Fill the real waking day: first slot starts between 07:30 and 09:00, last slot ends between 21:00 and 23:00.
   - Slots run in chronological order and must never overlap.
   - Set each slot's "slot" field to one of: ${SLOT_KEYS.join(", ")}.
   - The same slot id may appear twice in a day (e.g. two "afternoon" blocks) as long as the times stay sequential.

4. Several places in one slot
   - A slot holds 1 to 3 places. Use 2 or 3 whenever the stops are within about a 10-minute walk of each other, so they can be combined without transit — a temple plus the market street beside it, a museum plus the café across the square.
   - If reaching the next place takes more than roughly 15 minutes, do NOT bolt it onto the current slot. Start a new slot.

5. Honest dwell time — this is the most important rule
   - Give every place the time it genuinely deserves before moving on:
     · major museum, gallery or theme park: 2-4 hours
     · temple, shrine, castle, major landmark: 45-90 minutes
     · viewpoint, monument or photo stop: 20-40 minutes
     · market or shopping street: 1-2 hours
     · park or garden walk: 45-90 minutes
     · sit-down meal: 60-90 minutes | casual or street food: 30-45 minutes | café stop: 30-45 minutes
     · guided tour, show or class: its real running time
   - Never schedule a large famous attraction as a 30-minute stop. Fewer places done properly beats a checklist.

6. Travel time must add up
   - Give every place except the last one of the day a "travelToNext" with a realistic mode and minutes for THIS city.
   - The next place's startTime must be at least the previous endTime plus that travel time. Do the arithmetic and keep it consistent.
   - "duration" must match the gap between that place's own startTime and endTime.

7. A day a real person can survive
   - Anchor each day on one neighbourhood or district. Do not zig-zag back and forth across the city.
   - Include breakfast, lunch and dinner as real stops at named venues, not vague suggestions.
   - Leave a café, rest or downtime stop on heavy sightseeing days.
   - Cap it at 5-7 substantial sights per day; the rest should be meals, breaks and short stops.

8. Coordinates
   - "lat" and "lng" must be accurate real-world coordinates for that exact venue — not the city centre, not an approximation.

All times use 24-hour "HH:MM" format. Keep each "description" to 1-2 sentences.

Before answering, check there are exactly ${trip.days} days, and check every day: 5-7 chronological slots, 1-3 places per slot, 8-12 places in total, breakfast, lunch and dinner at named venues, travel times that add up, and a real blend of the traveller's interests that this destination can actually offer. "generalTips" must hold 4 to 6 tips specific to this destination, budget and travel style.

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
            … up to 2 more places within walking distance
          ]
        }
        … 4 to 6 more slots, running from breakfast through the evening
      ],
      "tips": "One practical tip specific to this day"
    }
    … one object per day, ${trip.days} days in total
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
          // Thinking tokens count toward this cap, and 14-day plans need the room
          maxOutputTokens:  65536,
        },
      }),
    })

    const data = await r.json()
    if (!r.ok) throw new Error(`${r.status} ${data.error?.status}: ${data.error?.message}`)

    const candidate = data.candidates?.[0]
    // Truncated output is unparseable JSON — fall back to the next model instead
    if (candidate?.finishReason === "MAX_TOKENS") throw new Error("response truncated")

    const parts = candidate?.content?.parts ?? []
    const text  = parts.find(p => !p.thought)?.text ?? parts[0]?.text
    if (!text) throw new Error("empty response")

    return { model, text }
  } catch (err) {
    const reason = err.name === "TimeoutError" ? "timed out" : err.message
    console.log(`[${model}] failed: ${reason}`)
    throw err
  }
}

async function callGemini(prompt) {
  const deadline = Date.now() + GENERATION_BUDGET_MS

  for (const model of MODELS) {
    const remaining = deadline - Date.now()
    if (remaining <= 0) break

    try {
      const { text } = await tryModel(model, prompt, AbortSignal.timeout(Math.min(remaining, MODEL_TIMEOUT_MS)))
      console.log(`Winner: ${model}`)
      return text
    } catch {
      // Reason already logged — fall through to the next model
    }
  }

  return null
}

function parsePlan(raw) {
  const start = raw.indexOf('{')
  const end   = raw.lastIndexOf('}')
  if (start === -1 || end === -1) return null

  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    return null
  }
}

// attribute_exists stops a late worker from recreating a trip deleted mid-generation
const savePlan = (tripId, plan) => db.send(new UpdateCommand({
  TableName: TRIPS_TABLE,
  Key: { tripId },
  ConditionExpression: "attribute_exists(tripId)",
  UpdateExpression: "SET aiPlan = :plan, aiPlanStatus = :ready, updatedAt = :now REMOVE aiPlanError",
  ExpressionAttributeValues: {
    ":plan":  plan,
    ":ready": "ready",
    ":now":   new Date().toISOString(),
  },
}))

const markFailed = (tripId, message) => db.send(new UpdateCommand({
  TableName: TRIPS_TABLE,
  Key: { tripId },
  ConditionExpression: "attribute_exists(tripId)",
  UpdateExpression: "SET aiPlanStatus = :failed, aiPlanError = :error",
  ExpressionAttributeValues: {
    ":failed": "failed",
    ":error":  message,
  },
}))

async function startGeneration(event) {
  const userId = event.requestContext.authorizer.jwt.claims.sub
  const { tripId } = event.pathParameters || {}

  try {
    const result = await db.send(new GetCommand({ TableName: TRIPS_TABLE, Key: { tripId } }))
    if (!result.Item) return res(404, { message: "Trip not found" })
    if (result.Item.userId !== userId) return res(403, { message: "Forbidden" })

    const now = Date.now()
    try {
      // Conditional so a double-click can't start two workers for the same trip
      await db.send(new UpdateCommand({
        TableName: TRIPS_TABLE,
        Key: { tripId },
        ConditionExpression: "attribute_not_exists(aiPlanStatus) OR aiPlanStatus <> :generating OR aiPlanStartedAt < :staleBefore",
        UpdateExpression: "SET aiPlanStatus = :generating, aiPlanStartedAt = :now REMOVE aiPlanError",
        ExpressionAttributeValues: {
          ":generating":  "generating",
          ":now":         new Date(now).toISOString(),
          ":staleBefore": new Date(now - STALE_AFTER_MS).toISOString(),
        },
      }))
    } catch (err) {
      if (err.name !== "ConditionalCheckFailedException") throw err
      console.log(`Plan already generating for trip: ${tripId}`)
      return res(202, { tripId, status: "generating" })
    }

    try {
      await lambda.send(new InvokeCommand({
        FunctionName:   process.env.AWS_LAMBDA_FUNCTION_NAME,
        InvocationType: "Event",
        Payload:        JSON.stringify({ job: "generate", tripId }),
      }))
    } catch (err) {
      await markFailed(tripId, "Could not start generating your itinerary. Please try again.")
      throw err
    }

    console.log(`Plan generation started for trip: ${tripId}`)
    return res(202, { tripId, status: "generating" })
  } catch (err) {
    console.error("Handler error:", err)
    return res(500, { message: err.message || "Internal server error" })
  }
}

async function generatePlan(tripId) {
  console.log(`Generating plan for trip: ${tripId}`)

  try {
    const { Item: trip } = await db.send(new GetCommand({ TableName: TRIPS_TABLE, Key: { tripId } }))
    if (!trip) {
      console.log(`Trip deleted before generation: ${tripId}`)
      return
    }

    console.log(`Trip found: ${trip.destination}, ${trip.days} days`)

    const raw = await callGemini(buildPrompt(trip))
    if (!raw) {
      await markFailed(tripId, "We couldn't generate your itinerary right now. Please try again in a moment.")
      return
    }

    const plan = parsePlan(raw)
    if (!plan) {
      console.error(`Unparseable plan (${raw.length} chars) for trip: ${tripId}`)
      await markFailed(tripId, "AI returned an incomplete itinerary. Please try again.")
      return
    }

    await savePlan(tripId, plan)
    console.log(`Plan saved for trip: ${tripId}`)
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      console.log(`Trip deleted during generation: ${tripId}`)
      return
    }
    console.error("Worker error:", err)
    await markFailed(tripId, "Something went wrong while generating your itinerary. Please try again.").catch(() => {})
  }
}

export const handler = async (event) => {
  // Background self-invocations carry a job payload; API Gateway events never do
  if (event.job === "generate") return generatePlan(event.tripId)
  return startGeneration(event)
}
