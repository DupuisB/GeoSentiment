/**
 * Main application script to initialize the map and display department sentiment
 */

(function() {
    // Variables to track if data is loaded
    let geoJsonLoaded = false;
    let sentimentDataLoaded = false;
    
    // Initialize map
    const map = L.map('map', {
        center: [46.603354, 1.888334], // Center of France
        zoom: 6,
        minZoom: 5,
        maxZoom: 10
    });
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Layer for departments
    const departmentsLayer = L.layerGroup().addTo(map);
    
    // Function to initialize the app when both datasets are loaded
    function initApp() {
        if (!geoJsonLoaded || !sentimentDataLoaded) return;
        console.log("Both datasets loaded, rendering map...");
        renderMap();
        // Hide loading indicator once map is rendered
        hideLoadingIndicator();
    }
    
    // Hide the loading indicator
    function hideLoadingIndicator() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
    
    // Listen for GeoJSON data loaded event
    document.addEventListener('geoJsonLoaded', function() {
        console.log("GeoJSON data loaded event received");
        geoJsonLoaded = true;
        initApp();
    });
    
    // Listen for sentiment data loaded event
    document.addEventListener('sentimentDataLoaded', function() {
        console.log("Sentiment data loaded event received");
        sentimentDataLoaded = true;
        initApp();
    });
    
    // Function to render the map with department data
    function renderMap() {
        // Clear existing layers
        departmentsLayer.clearLayers();
        
        // Get the data
        const departmentsGeoJSON = window.departmentsGeoJSON;
        const sentimentData = window.sentimentData;
        
        if (!departmentsGeoJSON || !departmentsGeoJSON.features) {
            console.error("Invalid GeoJSON data:", departmentsGeoJSON);
            hideLoadingIndicator();
            return;
        }
        
        console.log(`Rendering ${departmentsGeoJSON.features.length} departments`);
        
        // Add GeoJSON layer for departments
        L.geoJSON(departmentsGeoJSON, {
            style: function(feature) {
                const deptCode = feature.properties.code;
                let deptData = sentimentData[deptCode];
                
                // If no data exists for this department, generate random data
                if (!deptData && window.generateRandomSentiment) {
                    deptData = window.generateRandomSentiment(deptCode, feature.properties.nom);
                }
                
                return {
                    fillColor: deptData ? deptData.color : '#CCCCCC',
                    weight: 1,
                    opacity: 1,
                    color: 'white',
                    fillOpacity: 0.7
                };
            },
            onEachFeature: function(feature, layer) {
                // Get department code
                const deptCode = feature.properties.code;
                const deptName = feature.properties.nom;
                
                // Get sentiment data for this department
                let deptData = sentimentData[deptCode];
                
                // If no data exists for this department, generate random data
                if (!deptData && window.generateRandomSentiment) {
                    deptData = window.generateRandomSentiment(deptCode, deptName);
                }
                
                // Add popup with basic info
                layer.bindTooltip(deptName, {
                    permanent: false,
                    direction: 'center',
                    className: 'department-label'
                });
                
                // Add click event to show detailed info
                layer.on('click', function() {
                    showDepartmentInfo(deptCode, deptName, deptData);
                });
            }
        }).addTo(departmentsLayer);
        
        // Fit the map to the departments bounds
        map.fitBounds(L.geoJSON(departmentsGeoJSON).getBounds());
    }
    
    // Function to display department information in the info panel
    function showDepartmentInfo(code, name, data) {
        const infoPanel = document.getElementById('department-info');
        
        if (!data) {
            infoPanel.innerHTML = `
                <h3>${name} (${code})</h3>
                <p>No sentiment data available for this department.</p>
            `;
            return;
        }
        
        // Calculate sentiment description based on continuous scale
        let sentimentDesc;
        const score = data.sentimentScore;
        
        if (score >= 0.85) sentimentDesc = "Very Positive";
        else if (score >= 0.65) sentimentDesc = "Positive";
        else if (score >= 0.45) sentimentDesc = "Slightly Positive";
        else if (score >= 0.35) sentimentDesc = "Neutral";
        else if (score >= 0.15) sentimentDesc = "Slightly Negative";
        else if (score >= 0.05) sentimentDesc = "Negative";
        else sentimentDesc = "Very Negative";
        
        // Create HTML for info panel
        infoPanel.innerHTML = `
            <h3>${name} (${code})</h3>
            <div class="sentiment-score" style="background-color: ${data.color}; color: ${score > 0.5 ? 'black' : 'white'}">
                Sentiment: ${sentimentDesc} (${(score * 100).toFixed(1)}%)
            </div>
            <div class="stats">
                <div class="stat-item">
                    <span>Raw sentiment score:</span>
                    <span>${data.rawSentimentScore ? data.rawSentimentScore.toFixed(3) : 'N/A'}</span>
                </div>
                <div class="stat-item">
                    <span>Total mentions:</span>
                    <span>${data.totalMentions || (data.positiveCount + data.negativeCount + data.neutralCount)}</span>
                </div>
                <div class="stat-item">
                    <span>Positive mentions:</span>
                    <span>${data.positiveCount}</span>
                </div>
                <div class="stat-item">
                    <span>Negative mentions:</span>
                    <span>${data.negativeCount}</span>
                </div>
                <div class="stat-item">
                    <span>Neutral mentions:</span>
                    <span>${data.neutralCount}</span>
                </div>
            </div>
        `;
    }
})();
