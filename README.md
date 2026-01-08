What is this:

SafeRoute is a full-stack web app that visualizes recent crime data and finds safer driving routes in cities. It combines live crime data from Chicago with OSRM routing and a custom danger scoring system to steer users around higher-risk areas.

Why we built it:

Navigation apps usually care about speed and distance. They don’t care if the fastest route cuts through an area with a lot of recent violent crime. We wanted an alternative that lets people choose routes based on personal safety.

What it does:

SafeRoute has three main layers:

Backend data handling

Fetches up to ~2,000 recent crimes from the Chicago Open Data API

Standardizes raw crime labels into 5 categories: THEFT, BATTERY, ASSAULT, ROBBERY, HATE_CRIME

Applies a 5-tier severity weight (HATE_CRIME=10, ROBBERY=8, etc) to quantify urban risk

Frontend map and filters

Uses Leaflet.js to render an interactive map centered on Chicago

Renders crime markers plus a weighted heatmap

Supports filtering by crime type and date

Includes address autocomplete and UI elements like a draggable sidebar and error notices

Routing and safety scoring

Geocodes start and end addresses using Nominatim (OSM), prioritizing Chicago results

Requests up to 3 alternative driving routes from OSRM

Samples up to 50 points along each route geometry

For each sample point, sums weighted crime scores within a 0.003-degree radius

Aggregates total danger scores per route and labels them:

Safe (score < 20)

Moderate (score < 50)

High Risk (score ≥ 50)

Sorts routes by safety so users can choose what they prefer

Tech Stack:

Backend: Node.js + Express

Data Fetching: Axios (City of Chicago Open Data API)

Frontend Language: JavaScript

Mapping & Visualization: Leaflet.js (tiles, markers, heatmap)

Routing Engine: OSRM (Open Source Routing Machine)

UI Structure & Styling: HTML + CSS

Steps to run it locally:

Install Node.js (LTS)

Create a project folder and structure it like this:

saferoute/
├── server.js
├── public/
│   ├── index.html
│   └── app.js
└── package.json


Install dependencies:

npm init -y
npm install express axios cors


Start the server:

node server.js


Open the app in a browser:

http://localhost:5000

Future Improvements

Historical crime trends:
Instead of scoring routes using only recent crime reports, the system could incorporate multi-year crime data to capture seasonal patterns and long-term trends. This would give users a more stable view of risk instead of a snapshot tied to a short date window.

Dynamic danger radius by travel mode:
The current system applies a fixed geographic radius when scoring danger, which works for cars but doesn’t reflect how pedestrians or cyclists move through a city. Adding mode-specific radii would make the output more realistic. For example, walking routes might use a smaller radius that focuses on footpaths and intersections, while biking could extend the radius along bike lanes and shared roads. This would let users compare routes in a way that matches how they actually travel.
