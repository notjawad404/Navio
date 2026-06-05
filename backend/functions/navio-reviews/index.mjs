import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb"
import { randomUUID } from "crypto"

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const REVIEWS_TABLE = process.env.REVIEWS_TABLE
const TRIPS_TABLE = process.env.TRIPS_TABLE

const res = (code, body) => ({
  statusCode: code,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

export const handler = async (event) => {
  const userId = event.requestContext.authorizer.jwt.claims.sub
  const { tripId } = event.pathParameters || {}
  const body = event.body ? JSON.parse(event.body) : {}

  try {
    const tripResult = await db.send(new GetCommand({ TableName: TRIPS_TABLE, Key: { tripId } }))
    if (!tripResult.Item) return res(404, { message: "Trip not found" })

    const review = {
      reviewId: randomUUID(),
      tripId,
      userId,
      rating: body.rating,
      comment: body.comment ?? "",
      createdAt: new Date().toISOString(),
    }

    await db.send(new PutCommand({ TableName: REVIEWS_TABLE, Item: review }))
    return res(201, review)
  } catch (err) {
    console.error(err)
    return res(500, { message: "Internal server error" })
  }
}
