const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve the frontend (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// Improved crime type mapping with more accuracy
function mapCrimeType(primaryType, description) {
    const type = primaryType.toUpperCase();
    const desc = (description || "").toUpperCase();
    
    // More specific gender-based hate crime detection
    if (type === "SEX OFFENSE" || 
        type === "CRIM SEXUAL ASSAULT" ||
        type === "STALKING" ||
        (type === "CRIMINAL SEXUAL ASSAULT") ||
        desc.includes("GENDER IDENTITY") ||
        desc.includes("SEXUAL ORIENTATION")) {
        return "HATE_CRIME";
    }
    
    // Direct mappings
    if (type === "THEFT" || type === "BURGLARY" || type === "MOTOR VEHICLE THEFT") return "THEFT";
    if (type === "BATTERY" || type === "AGGRAVATED BATTERY") return "BATTERY";
    if (type === "ASSAULT" || type === "AGGRAVATED ASSAULT") return "ASSAULT";
    if (type === "ROBBERY" || type === "ARMED ROBBERY") return "ROBBERY";
    
    // Partial matches
    if (type.includes("THEFT")) return "THEFT";
    if (type.includes("BATTERY")) return "BATTERY";
    if (type.includes("ASSAULT")) return "ASSAULT";
    if (type.includes("ROBBERY")) return "ROBBERY";
    
    // FIXED: Return default instead of null
    return "THEFT"; // Default fallback instead of null
}

// Add crime severity scoring
function getCrimeSeverity(type) {
    const severityMap = {
        HATE_CRIME: 10,
        ROBBERY: 8,
        ASSAULT: 7,
        BATTERY: 5,
        THEFT: 3
    };
    return severityMap[type] || 3;
}

// === CRIME DATA ENDPOINT ===
app.get("/api/crime", async (req, res) => {
    try {
        // FIXED: Use fixed date like v1 for consistency
        const dateFilter = '2024-11-01';
        
        // FIXED: Use reasonable limit (v1 used 500, we'll use 2000 for more data)
        const url = `https://data.cityofchicago.org/resource/ijzp-q8t2.json?$limit=2000&$where=date>'${dateFilter}' AND latitude IS NOT NULL AND longitude IS NOT NULL&$order=date DESC`;

        console.log(`📅 Fetching crimes since: ${dateFilter}`);
        console.log(`🔗 API URL: ${url}`);

        const response = await axios.get(url, {
            headers: { 
                "X-App-Token": "" // Add your API token here for better rate limits
            },
            timeout: 30000 // 30 second timeout
        });

        const data = response.data;
        console.log(`📦 Raw API returned ${data.length} records`);

        // Track crime type statistics
        const crimeStats = {};
        
        const points = data
            .filter(d => d.latitude && d.longitude) // Keep filter
            .map(d => {
                const mappedType = mapCrimeType(d.primary_type || "", d.description || "");
                
                // Track statistics
                crimeStats[mappedType] = (crimeStats[mappedType] || 0) + 1;
                
                // FIXED: Always return an object (no null filtering)
                return {
                    lat: parseFloat(d.latitude),
                    lng: parseFloat(d.longitude),
                    type: mappedType,
                    desc: d.description || d.primary_type || "",
                    date: d.date ? new Date(d.date).toLocaleDateString() : "",
                    rawDate: d.date,
                    rawType: d.primary_type,
                    severity: getCrimeSeverity(mappedType),
                    block: d.block || "Unknown location",
                    arrestMade: d.arrest === "true" || d.arrest === true
                };
            });

        console.log(`✅ Mapped ${points.length} crime points`);
        console.log(`📊 Crime breakdown:`, crimeStats);
        
        res.json({ 
            points,
            stats: crimeStats,
            totalRecords: data.length,
            mappedRecords: points.length
        });
    } catch (err) {
        console.error("❌ ERROR fetching crime data:", err.message);
        if (err.response) {
            console.error("Response status:", err.response.status);
            console.error("Response data:", err.response.data);
        }
        res.status(500).json({ 
            error: "Failed to fetch crime data",
            message: err.message 
        });
    }
});

// === HEALTH CHECK ENDPOINT ===
app.get("/api/health", (req, res) => {
    res.json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        service: "SafeRoute API"
    });
});

// === START SERVER ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📂 Serving files from: ${path.join(__dirname, "public")}`);
    console.log(`🗺️  Open http://localhost:${PORT} in your browser`);
    console.log(`💚 Health check available at: http://localhost:${PORT}/api/health`);
});
