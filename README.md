# Introduction

This was done as a (very) quick experiment to experiment a bit with user sentiment analysis.
This is an algorithm (integrated in a web static page) that tries to give an overall sentiment score to each department in France.
This was done in a very basic way: by performing a sentiment analysis on all messages posted in r/France that includes the explicit mention of a departement, and then by averaging the scores.

# GeoSentiment Map Setup Instructions

## Quick Start

To run the website properly, follow these steps:

1. **Create a local server** (required to avoid CORS issues)

   Using Python (recommended):
   ```bash
   # Navigate to your project folder
   cd /c:/Users/benjamin/Documents/ai/geosentiment
   
   # Start a local server with Python 3
   python -m http.server 8000
   ```

2. **Open the website** in your browser:
   - Go to: http://localhost:8000/

## Troubleshooting

### If you see 404 errors:

1. Make sure the file structure is correct:
   ```
   /geosentiment
   ├── index.html
   ├── css/
   │   └── style.css
   ├── js/
   │   ├── app.js
   │   ├── sentiment-data.js
   │   └── shp-to-geojson.js
   └── data/
       └── departments.geojson
   ```

2. The sample data will be used if the actual shapefile or GeoJSON is not found.

### If the map doesn't load properly:

1. Check your browser console for errors
2. Make sure you're accessing the site via a local server (not directly opening the HTML file)
3. If you're using the real `contours_departements.shp` file, place it in the root directory

## Using Your Real Data

1. Place `contours_departements.shp` in the root directory
2. Update `js/sentiment-data.js` with your actual sentiment analysis data
3. Refresh the page
