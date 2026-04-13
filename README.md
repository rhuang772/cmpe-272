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
- Plane fetcher microservice in the background


If you also want the frontend:

- in another terminal go to client
- run `npm run dev`
- open http://localhost:5173

