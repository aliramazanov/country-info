# Country Info API

A simple application that provides information about countries, including basic details, borders, population data, flags, and public holidays.

## Features

- Get a list of available countries
- View detailed information about a country
- Add public holidays from different countries to a user's calendar
- View a user's saved holidays
- Get public holidays for a country and year

## Tech

- Nest.js
- TypeScript
- MongoDB
- Postman

## Requirements

- [Node.js](https://nodejs.org/en/)
- [pnpm](https://pnpm.io/installation)
- [MongoDB](https://www.mongodb.com/try/download/community) (optional - falls back to in-memory database if not available)

## Setup

### 1. Clone the repo

```bash
git clone <repository-url>
cd country-info
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up env

The app uses a `.env` file for configuration. A default one is included intentionally.

### 4. Start the application

For development:

```bash
pnpm run start:dev
```

The app will run on http://localhost:3000

## Endpoints

### Countries

- `GET /api/countries` - List of all countries
- `GET /api/countries/:countryCode` - Info on a specific country (2-letter country code)

### Calendar

- `GET /api/users/public-holidays/:year/:countryCode` - Public holidays for a specific country and year
- `GET /api/users/:userId/calendar/holidays` - All holidays saved to a user's calendar
- `POST /api/users/:userId/calendar/holidays` - Add holidays to a user's calendar

## Testing the API

- Postman collection included with all endpoints

The application includes a test user with ID: `644a612a1fe93a876543210f`
You can use this ID to test the calendar endpoints.

### Example: Add holidays to calendar

```bash
curl -X POST http://localhost:3000/api/users/644a612a1fe93a876543210f/calendar/holidays \
  -H "Content-Type: application/json" \
  -d '{"countryCode":"US","year":2023}'
```

### Example: Get country details

```bash
curl http://localhost:3000/api/countries/CA
```

## Troubleshooting

- If the application can't connect to MongoDB, it will automatically fall back to an in-memory MongoDB server.
- Check the console logs for any error messages or connection issues.
- Make sure the required APIs (date.nager.at and countriesnow. Space) are accessible from your network.
