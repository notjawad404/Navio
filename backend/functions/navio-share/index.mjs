import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb"

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TRIPS_TABLE = process.env.TRIPS_TABLE

const res = (code, body) => ({
  statusCode: code,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

export const handler = async (event) => {
  const userId = event.requestContext.authorizer.jwt.claims.sub
  const { tripId } = event.pathParameters || {}

  try {
    const result = await db.send(new GetCommand({ TableName: TRIPS_TABLE, Key: { tripId } }))
    if (!result.Item) return res(404, { message: "Trip not found" })
    if (result.Item.userId !== userId) return res(403, { message: "Forbidden" })

    return res(200, {
      tripId,
      shareUrl: `${process.env.FRONTEND_URL}/share/${tripId}`,
    })
  } catch (err) {
    console.error(err)
    return res(500, { message: "Internal server error" })
  }
}
