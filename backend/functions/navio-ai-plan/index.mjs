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

function buildPrompt(trip) {
  return `You are an expert travel planner. Create a detailed day-by-day itinerary for this trip.

Trip details:
- Destination: ${trip.destination}
- Duration: ${trip.days} days
- Budget level: ${trip.budget}
- Travel style: ${trip.travelStyle}
- Interests: ${(trip.interests || []).join(", ") || "general sightseeing"}
${trip.notes ? `- Special notes: ${trip.notes}` : ""}

Return ONLY a valid JSON object with no markdown, no explanation, no code block. Use this exact structure:
{
  "summary": "2-3 sentence overview of the trip experience",
  "days": [
    {
      "day": 1,
      "theme": "Short catchy theme for this day",
      "morning": {
        "place": "Place or area name",
        "activity": "What to do there",
        "description": "2-3 sentences about why this is great and what to expect",
        "duration": "e.g. 2 hours",
        "lat": 0.0,
        "lng": 0.0
      },
      "afternoon": {
        "place": "Place or area name",
        "activity": "What to do there",
        "description": "2-3 sentences about why this is great and what to expect",
        "duration": "e.g. 3 hours",
        "lat": 0.0,
        "lng": 0.0
      },
      "evening": {
        "place": "Place or area name",
        "activity": "What to do there",
        "description": "2-3 sentences about why this is great and what to expect",
        "duration": "e.g. 2 hours",
        "lat": 0.0,
        "lng": 0.0
      },
      "tips": "One practical tip specific to this day"
    }
  ],
  "generalTips": ["tip 1", "tip 2", "tip 3", "tip 4"],
  "estimatedCost": "Brief per-person cost estimate for ${trip.budget} budget traveller"
}

IMPORTANT: Replace each 0.0 placeholder with accurate real-world latitude and longitude coordinates for that specific place. Use your knowledge of the destination to provide precise coordinates for landmarks, neighbourhoods, restaurants, and attractions.`
}

async function tryModel(model, prompt, signal) {
  try {
    const r = await fetch(`${BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    })

    const data = await r.json()
    if (!r.ok) throw new Error(`${r.status} ${data.error?.status}`)

    const parts = data.candidates?.[0]?.content?.parts ?? []
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
  const controllers = MODELS.map(() => new AbortController())
  const globalTimer = setTimeout(() => {
    controllers.forEach(c => c.abort())
  }, 20000)

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
    const plan = JSON.parse(raw.slice(start, end + 1))

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
