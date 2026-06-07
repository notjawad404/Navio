import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb"
import { randomUUID } from "crypto"

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const PLACES_TABLE = process.env.PLACES_TABLE
const TRIPS_TABLE = process.env.TRIPS_TABLE

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

export const handler = async (event) => {
  const userId = event.requestContext.authorizer.jwt.claims.sub
  const { tripId } = event.pathParameters || {}
  const body = event.body ? JSON.parse(event.body) : {}

  try {
    const tripResult = await db.send(new GetCommand({ TableName: TRIPS_TABLE, Key: { tripId } }))
    if (!tripResult.Item) return res(404, { message: "Trip not found" })
    if (tripResult.Item.userId !== userId) return res(403, { message: "Forbidden" })

    const place = {
      placeId: randomUUID(),
      tripId,
      name: body.name,
      lat: body.lat,
      lng: body.lng,
      category: body.category ?? "general",
      notes: body.notes ?? "",
      createdAt: new Date().toISOString(),
    }

    await db.send(new PutCommand({ TableName: PLACES_TABLE, Item: place }))
    return res(201, place)
  } catch (err) {
    console.error(err)
    return res(500, { message: "Internal server error" })
  }
}
