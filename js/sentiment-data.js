/**
 * This file contains the sentiment data for each department
 * Loads data from the department_sentiment_analysis.json file
 */

(function() {
    // This will hold our sentiment data
    const sentimentData = {};
    
    // Function to get color from continuous scale based on score (0-1)
    function getColorFromScale(score) {
        // Using interpolation for a red-yellow-green gradient
        if (score < 0.5) {
            // Interpolate between red (0) and yellow (0.5)
            const r = 255;
            const g = Math.round(255 * (score / 0.5));
            const b = 0;
            return `rgb(${r}, ${g}, ${b})`;
        } else {
            // Interpolate between yellow (0.5) and green (1.0)
            const r = Math.round(255 * (1 - (score - 0.5) / 0.5));
            const g = 255;
            const b = 0;
            return `rgb(${r}, ${g}, ${b})`;
        }
    }
    
    // Normalize scores relative to min and max values
    function normalizeScores(data) {
        // First find min and max scores
        let minScore = Infinity;
        let maxScore = -Infinity;
        
        for (const deptCode in data) {
            const score = data[deptCode].rawSentimentScore;
            if (score < minScore) minScore = score;
            if (score > maxScore) maxScore = score;
        }
        
        console.log(`Normalizing sentiment scores: min=${minScore.toFixed(3)}, max=${maxScore.toFixed(3)}`);
        
        // Now normalize all scores to 0-1 range
        const scoreRange = maxScore - minScore;
        for (const deptCode in data) {
            // Calculate normalized score where min=0 and max=1
            data[deptCode].sentimentScore = (data[deptCode].rawSentimentScore - minScore) / scoreRange;
            
            // Update color based on new normalized score (continuous scale)
            data[deptCode].color = getColorFromScale(data[deptCode].sentimentScore);
        }
        
        return data;
    }

    // Load the sentiment data from the JSON file
    async function loadSentimentData() {
        try {
            console.log("Loading sentiment data from department_sentiment_analysis.json");
            const response = await fetch('./department_sentiment_analysis.json');
            if (!response.ok) {
                throw new Error(`Failed to load sentiment data: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log("Sentiment data loaded successfully!");
            
            const tempData = {};
            
            // Process each department's data
            for (const [code, deptData] of Object.entries(data)) {
                const positiveCount = deptData.sentiment_distribution.positive;
                const negativeCount = deptData.sentiment_distribution.negative;
                const neutralCount = deptData.sentiment_distribution.neutral;
                
                // Store raw sentiment score for normalization
                tempData[code] = {
                    name: deptData.name,
                    rawSentimentScore: deptData.avg_sentiment,
                    positiveCount: positiveCount,
                    negativeCount: negativeCount,
                    neutralCount: neutralCount,
                    totalMentions: deptData.mentions
                };
            }
            
            // Normalize scores across all departments
            const normalizedData = normalizeScores(tempData);
            
            // Add normalized data to sentimentData object
            Object.assign(sentimentData, normalizedData);
            
            console.log(`Processed sentiment data for ${Object.keys(sentimentData).length} departments`);
            window.sentimentData = sentimentData;
            
            // Find best and worst departments for reference
            let bestDept = { code: '', score: -Infinity };
            let worstDept = { code: '', score: Infinity };
            
            for (const code in sentimentData) {
                const rawScore = sentimentData[code].rawSentimentScore;
                if (rawScore > bestDept.score) {
                    bestDept = { code, score: rawScore, name: sentimentData[code].name };
                }
                if (rawScore < worstDept.score) {
                    worstDept = { code, score: rawScore, name: sentimentData[code].name };
                }
            }
            
            console.log(`Most positive department: ${bestDept.name} (${bestDept.code}) with raw score: ${bestDept.score.toFixed(3)}`);
            console.log(`Most negative department: ${worstDept.name} (${worstDept.code}) with raw score: ${worstDept.score.toFixed(3)}`);
            
            // Dispatch event to signal that data is loaded
            const event = new Event('sentimentDataLoaded');
            document.dispatchEvent(event);
            
        } catch (error) {
            console.error("Error loading sentiment data:", error);
            useSampleData();
        }
    }
    
    // Fallback to sample data if loading fails
    function useSampleData() {
        console.log("Using sample sentiment data");
        // Default data for a few departments
        const sampleData = {
            "75": { 
                name: "Paris",
                sentimentScore: 0.68,
                rawSentimentScore: 0.046,
                positiveCount: 42357,
                negativeCount: 13694,
                neutralCount: 127048,
                totalMentions: 183099
            }
        };
        
        // Add color to sample data
        for (const code in sampleData) {
            sampleData[code].color = getColorFromScale(sampleData[code].sentimentScore);
        }
        
        window.sentimentData = sampleData;
        
        // Dispatch event to signal that data is loaded
        const event = new Event('sentimentDataLoaded');
        document.dispatchEvent(event);
    }
    
    // Generate random sentiment data for departments not in our list
    window.generateRandomSentiment = function(code, name) {
        if (sentimentData[code]) return sentimentData[code];
        
        const randomScore = Math.random(); // Between 0 and 1
        const totalMentions = Math.floor(Math.random() * 1000) + 500;
        const positiveRatio = 0.2 + (randomScore * 0.3); // 20-50% positive
        const negativeRatio = 0.1 + ((1 - randomScore) * 0.2); // 10-30% negative
        
        const positiveCount = Math.floor(totalMentions * positiveRatio);
        const negativeCount = Math.floor(totalMentions * negativeRatio);
        const neutralCount = totalMentions - positiveCount - negativeCount;
        
        sentimentData[code] = {
            name: name,
            sentimentScore: randomScore,
            rawSentimentScore: (randomScore * 0.2) - 0.1, // Simulated raw score
            positiveCount: positiveCount,
            negativeCount: negativeCount,
            neutralCount: neutralCount,
            totalMentions: totalMentions,
            color: getColorFromScale(randomScore)
        };
        
        return sentimentData[code];
    };
    
    // Start loading the data
    loadSentimentData();
})();
