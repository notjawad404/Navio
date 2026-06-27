# Navio Backend Setup

This backend is a plain Node.js Express app for Navio. It is intentionally designed for step-by-step development without AWS Lambda or SAM.

## Prerequisites
- Node.js 18+ installed
- npm installed

## Install dependencies
```bash
cd backend
npm install
```

## Run locally
```bash
npm run dev
```

The API will start on port `3000` by default.

## Environment variables
Create a `.env` file in `backend/` with values such as:
```env
PORT=3000
COGNITO_USER_POOL_ID=your_user_pool_id
COGNITO_CLIENT_ID=your_client_id
USERS_TABLE=NavioUsers
TRIPS_TABLE=NavioTrips
PLACES_TABLE=NavioPlaces
ITINERARIES_TABLE=NavioItineraries
REVIEWS_TABLE=NavioReviews
MEDIA_BUCKET=navio-media-bucket
```

## Project structure
- `src/index.js` - Express app entrypoint
- `src/routes/auth.js` - auth routes
- `src/routes/trips.js` - trip CRUD routes
- `src/routes/places.js` - place routes
- `src/routes/reviews.js` - review routes
- `src/controllers/` - request handlers
- `src/config.js` - environment configuration

## Next steps
1. Build route handlers in `src/controllers/`
2. Add AWS integration only after the Node.js API is working locally
3. Add database layers and authentication services gradually
