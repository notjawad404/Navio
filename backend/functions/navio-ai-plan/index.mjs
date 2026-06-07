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
  const { tripId } = event.pathParameters || {}
  return res(200, {
    tripId,
    message: "AI planning coming soon",
  })
}
