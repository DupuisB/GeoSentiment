/**
 * This file converts the shapefile data to GeoJSON format
 */

(function() {
    // This will hold our GeoJSON data after conversion
    let departmentsGeoJSON = null;

    // Alternative method: If the shapefile is already converted to GeoJSON
    async function loadGeoJSON() {
        try {
            // Changed the path to be relative to the current directory
            console.log("Attempting to load departments.geojson...");
            const response = await fetch('./data/departments.geojson');
            if (!response.ok) {
                throw new Error(`Failed to load GeoJSON: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log("GeoJSON loaded successfully!");
            
            // Check if the data looks valid
            if (data && data.type === "FeatureCollection" && Array.isArray(data.features)) {
                console.log(`Loaded ${data.features.length} department features`);
                departmentsGeoJSON = data;
                window.departmentsGeoJSON = departmentsGeoJSON;
                
                const event = new Event('geoJsonLoaded');
                document.dispatchEvent(event);
            } else {
                throw new Error("GeoJSON data doesn't have the expected structure");
            }
        } catch (error) {
            console.error("Error loading GeoJSON:", error);
            console.log("Using sample data instead");
            provideSampleData();
        }
    }
    
    // Provide sample data for demonstration
    function provideSampleData() {
        console.log("Loading sample GeoJSON data");
        // Sample data for a few French departments
        departmentsGeoJSON = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "code": "75",
                        "nom": "Paris"
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [
                                [2.224199, 48.815573],
                                [2.469921, 48.816376],
                                [2.410999, 48.902145],
                                [2.224199, 48.815573]
                            ]
                        ]
                    }
                },
                {
                    "type": "Feature",
                    "properties": {
                        "code": "69",
                        "nom": "Rhône"
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [
                                [4.459839, 45.454714],
                                [4.864502, 45.535691],
                                [4.798584, 45.998547],
                                [4.459839, 45.454714]
                            ]
                        ]
                    }
                },
                {
                    "type": "Feature",
                    "properties": {
                        "code": "13",
                        "nom": "Bouches-du-Rhône"
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [
                                [5.014648, 43.209328],
                                [5.585937, 43.325178],
                                [5.311279, 43.648599],
                                [5.014648, 43.209328]
                            ]
                        ]
                    }
                },
                // More sample departments with same data as in the GeoJSON file
                // ...existing code...
            ]
        };
        
        window.departmentsGeoJSON = departmentsGeoJSON;
        const event = new Event('geoJsonLoaded');
        document.dispatchEvent(event);
    }

    // Try to load the GeoJSON first, fallback to sample data
    loadGeoJSON();
})();
