# cmpe-272

Apache Kafka stack with Kafka UI, run via Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2+)

To run the app:

Run it from the repo root cmpe-272.

First, start Docker Desktop. Then in a terminal:

`docker compose up --build`

That starts:

- Kafka on localhost:9092
- Kafka UI on http://localhost:8080
- API gateway on http://localhost:4000
- plane fetcher in the background

If you want to test the Kafka path without real OpenSky data yet, open a second terminal and run:

`cd "C:\Users\phamm\OneDrive\Desktop\Personal CS project\CMPE 272 - SW Enterprise\cmpe-272\services\plane-fetcher"
npm run publish:test-event`

Then check the gateway:

`curl "http://localhost:4000/planes/opensky?icao24=4ca2b1"`

If you also want the frontend:

- in another terminal go to client
- run npm run dev
- open http://localhost:5173

So the shortest full flow is:

`docker compose up --build`

Then optionally:

`cd services\plane-fetcher
npm run publish:test-event`

Then open:

- http://localhost:8080 for Kafka UI
- http://localhost:4000/planes/opensky?icao24=4ca2b1 for the gateway
- http://localhost:5173 for the React app
