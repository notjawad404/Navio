const res = (code, body) => ({
  statusCode: code,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

export const handler = async (event) => {
  const { tripId } = event.pathParameters || {}
  return res(200, {
    tripId,
    message: "AI planning coming soon",
  })
}
