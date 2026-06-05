import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb"
import { randomUUID } from "crypto"

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TABLE = process.env.TRIPS_TABLE

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
    switch (event.routeKey) {

      case "GET /trips": {
        const result = await db.send(new QueryCommand({
          TableName: TABLE,
          IndexName: "userId-index",
          KeyConditionExpression: "userId = :uid",
          ExpressionAttributeValues: { ":uid": userId },
        }))
        return res(200, result.Items)
      }

      case "POST /trips": {
        const trip = {
          tripId: randomUUID(),
          userId,
          title: body.title,
          destination: body.destination,
          startDate: body.startDate,
          endDate: body.endDate,
          budget: body.budget ?? null,
          interests: body.interests ?? [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        await db.send(new PutCommand({ TableName: TABLE, Item: trip }))
        return res(201, trip)
      }

      case "GET /trips/{tripId}": {
        const result = await db.send(new GetCommand({ TableName: TABLE, Key: { tripId } }))
        if (!result.Item) return res(404, { message: "Trip not found" })
        if (result.Item.userId !== userId) return res(403, { message: "Forbidden" })
        return res(200, result.Item)
      }

      case "PUT /trips/{tripId}": {
        const existing = await db.send(new GetCommand({ TableName: TABLE, Key: { tripId } }))
        if (!existing.Item) return res(404, { message: "Trip not found" })
        if (existing.Item.userId !== userId) return res(403, { message: "Forbidden" })
        const updated = {
          ...existing.Item,
          ...body,
          tripId,
          userId,
          updatedAt: new Date().toISOString(),
        }
        await db.send(new PutCommand({ TableName: TABLE, Item: updated }))
        return res(200, updated)
      }

      case "DELETE /trips/{tripId}": {
        const existing = await db.send(new GetCommand({ TableName: TABLE, Key: { tripId } }))
        if (!existing.Item) return res(404, { message: "Trip not found" })
        if (existing.Item.userId !== userId) return res(403, { message: "Forbidden" })
        await db.send(new DeleteCommand({ TableName: TABLE, Key: { tripId } }))
        return res(200, { message: "Trip deleted" })
      }

      default:
        return res(404, { message: "Route not found" })
    }
  } catch (err) {
    console.error(err)
    return res(500, { message: "Internal server error" })
  }
}
