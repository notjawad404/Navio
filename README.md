# Navio — AI Travel Planner

Navio is an AI travel planner that turns a destination and your preferences into a detailed, hour-by-hour itinerary. Choose a trip length of up to 14 days, a budget, a travel style and your interests, and Google Gemini builds a plan with named venues, timings and travel between stops.

While the plan generates in the background, Navio shows a guide to the destination with photos, key facts and practical details. Finished trips are saved to your account, where you can follow each day on a timeline and interactive map and tick off the stops you've visited.

Navio is built with React on the frontend and serverless AWS services on the backend, with Amazon Cognito handling accounts and sign-in.

## Features

### AI itinerary generation

- Plan a trip from 1 to 14 days by choosing a destination, budget, travel style and interests, with optional free-text notes
- **Budgets:** Budget, Moderate, Luxury
- **Travel styles:** Cultural, Adventure, Relaxation, Romantic, Family
- **Interests:** Food & Dining, History, Nature, Shopping, Nightlife, Museums, Beaches, Architecture, Adventure, Wellness
- Each day is split into time-of-day blocks with named venues, start and end times, durations, coordinates and travel time to the next stop
- Each plan includes a trip summary, a theme and neighbourhood for every day, daily and general tips, and an estimated cost
- Generation runs in the background, so you can leave the page and the plan keeps building
- If a Gemini model fails or times out, the next model in the list is tried

### Destination spelling check

- Looks up the destination when you leave the field and offers a "Did you mean…?" suggestion, which you can accept or dismiss
- Likely misspellings are corrected on submit, and the generating screen shows what was corrected

### Destination guide while you wait

While a plan generates, Navio shows information about the destination from Wikipedia, Wikidata and Wikimedia Commons:

- Photo slideshow, location map and a video when one is available
- Quick facts such as population, area, elevation, founding year and time zone
- Practical details such as currency, language, driving side, calling code, power sockets and emergency numbers
- Historical events and short article summaries on topics like history, climate, food and getting around

### Itinerary view

- **Overview:** every day at a glance with its theme, stop count and active hours, plus travel tips, estimated cost and your preferences
- **Day timeline:** stops in order with times, durations, descriptions and travel between them
- **Time-of-day filters:** narrow a day down to specific blocks, such as morning or evening
- **Interactive maps:** see the whole trip, preview a day's route by hovering over it, or open a day for numbered pins colour-coded by time of day
- **Visited checkmarks:** tick off stops and track progress for each day (saved in the current browser)

### Trip management

- All generated trips are saved to your account
- Each trip shows its status: Itinerary ready, Generating, Generation failed or Draft
- Filter by all trips, ready itineraries or drafts, and sort by most recent or name
- Delete a trip with a confirmation step and a 5-second undo

### Accounts and profile

- Email sign-up with a verification code, sign-in and sign-out
- Forgot-password flow using an emailed reset code
- Update your name, change your email with code verification, and change your password
- Upload a profile photo

## Tools and technologies

### Frontend

| Tool | Used for |
|---|---|
| [React 19](https://react.dev) | UI |
| [React Router 7](https://reactrouter.com) | Client-side routing |
| [Vite 8](https://vite.dev) | Dev server and builds |
| [Tailwind CSS 4](https://tailwindcss.com) | Styling |
| [Leaflet](https://leafletjs.com) and [React Leaflet](https://react-leaflet.js.org) | Interactive maps |
| [AWS Amplify 6](https://docs.amplify.aws) | Cognito authentication client |
| [ESLint](https://eslint.org) | Linting |

### Backend and cloud

| Tool | Used for |
|---|---|
| AWS Lambda (Node.js) | API functions and background plan generation |
| Amazon API Gateway (HTTP API) | API routing and JWT authorization |
| Amazon Cognito | User accounts and tokens |
| Amazon DynamoDB | Trip, place and review data |
| Amazon S3 | Profile photo storage through presigned upload URLs |
| AWS SDK for JavaScript v3 | DynamoDB, S3 and Lambda access |

### External services

| Service | Used for |
|---|---|
| [Google Gemini API](https://ai.google.dev) | Itinerary generation |
| Wikipedia, Wikidata and Wikimedia Commons | Destination guide and spelling check |
| [OpenStreetMap](https://www.openstreetmap.org) | Map tiles |
| [Unsplash](https://unsplash.com) | Destination photos on the landing and home pages |
| [Google Fonts](https://fonts.google.com) | Bricolage Grotesque and Instrument Sans |

### Developer tooling

| Tool | Used for |
|---|---|
| AWS CLI | Uploading Lambda code |
| archiver | Zipping functions for deployment |
| chokidar | Redeploying functions when files change |
| Express, dotenv and nodemon | Minimal local server with a health check |

## Project structure

```
Navio/
├── frontend/
│   └── src/
│       ├── components/     # Auth screens, layout, itinerary and map UI
│       ├── config/         # Amplify configuration
│       ├── context/        # Authentication state
│       ├── lib/            # API client and service modules
│       └── pages/          # Landing, home, plan, trips, trip detail, profile
└── backend/
    ├── functions/          # One folder per Lambda function
    │   ├── navio-ai-plan/
    │   ├── navio-places/
    │   ├── navio-reviews/
    │   ├── navio-share/
    │   ├── navio-trips/
    │   └── navio-upload/
    ├── src/index.js        # Local Express server (GET /health only)
    ├── deploy.js           # Zip and upload Lambda functions
    └── watch.js            # Redeploy functions on file change
```

## API

| Method | Path | Description |
|---|---|---|
| GET | `/trips` | List the signed-in user's trips |
| POST | `/trips` | Create a trip |
| GET | `/trips/{tripId}` | Get a trip |
| PUT | `/trips/{tripId}` | Update a trip |
| DELETE | `/trips/{tripId}` | Delete a trip |
| POST | `/trips/{tripId}/ai-plan` | Start plan generation (returns `202`) |
| POST | `/trips/{tripId}/places` | Add a place to a trip |
| POST | `/trips/{tripId}/reviews` | Add a review to a trip |
| GET | `/trips/{tripId}/share` | Get a share URL for a trip |
| POST | `/upload-url` | Get a presigned S3 URL for an image upload |

The frontend starts generation with `POST /trips/{tripId}/ai-plan`, then polls `GET /trips/{tripId}` every 3 seconds until `aiPlanStatus` is `ready` or `failed`.

The places, reviews and share endpoints are API-only and aren't used by the web app. The web app also has no page at the `/share/{tripId}` URL that the share endpoint returns.

## Getting started

### Prerequisites

- Node.js and npm
- An AWS account and the AWS CLI, configured with `aws configure`
- A Google Gemini API key

### AWS resources

This repository has no infrastructure-as-code, so create these resources in your AWS account first. The deploy script only uploads code to Lambda functions that already exist.

- **Cognito:** a user pool with email sign-in and an app client without a client secret
- **DynamoDB tables:**

  | Table | Partition key | Global secondary index |
  |---|---|---|
  | Trips | `tripId` (String) | `userId-index` on `userId` (String) |
  | Places | `placeId` (String) | None |
  | Reviews | `reviewId` (String) | None |

- **S3:** a bucket for profile photos, with public read access to `profile-images/*` and CORS that allows `PUT` from your frontend's origin
- **Lambda:** the six functions under `backend/functions/`, using the same names as their folders. The functions need the following permissions and settings:
  - Access to the DynamoDB tables and the S3 bucket
  - `navio-ai-plan` must be allowed to invoke itself, and its timeout should be 540 seconds to fit its 8-minute generation budget
- **API Gateway:** an HTTP API with the routes above, using payload format 2.0 and a Cognito JWT authorizer. Every route except `/upload-url` must use the authorizer, because those functions read the user ID from the token.

### Lambda environment variables

| Variable | Functions | Value |
|---|---|---|
| `TRIPS_TABLE` | `navio-trips`, `navio-ai-plan`, `navio-places`, `navio-reviews`, `navio-share` | Trips table name |
| `PLACES_TABLE` | `navio-places` | Places table name |
| `REVIEWS_TABLE` | `navio-reviews` | Reviews table name |
| `GEMINI_API_KEY` | `navio-ai-plan` | Gemini API key |
| `FRONTEND_URL` | `navio-share` | Base URL used in share links |
| `S3_BUCKET` | `navio-upload` | Bucket name |
| `S3_REGION` | `navio-upload` | Bucket region |

### Deploy the backend

```bash
cd backend
npm install

npm run deploy                  # deploy all functions
npm run deploy -- navio-trips   # deploy one function
npm run watch                   # redeploy on file change
```

The target region is set to `ap-southeast-1` in `deploy.js` and `watch.js`.

### Run the frontend

Create `frontend/.env`:

```env
VITE_COGNITO_USER_POOL_ID=your_user_pool_id
VITE_COGNITO_CLIENT_ID=your_app_client_id
VITE_API_URL=https://your_api_id.execute-api.your_region.amazonaws.com
```

Then start the dev server:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Lambda functions set `Access-Control-Allow-Origin` to this address, so running from another origin means changing the `CORS` constant in each function.

### Frontend scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
