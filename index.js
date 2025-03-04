import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.OMDB_API_KEY;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended:true }));

app.get("/", (req, res) => {
    res.render("index.ejs")
});

app.post("/get-movies", async (req, res) => {
    try {
        const movieSearched = req.body.movie;
        const result = await axios.get(`http://www.omdbapi.com/?t=${movieSearched}&apikey=${apiKey}`);
        const movie = result.data;

        // Check if movie exists
        if (movie.Response === "False") {
            return res.render("index.ejs", {
                error: "Movie not found! Try searching another title.",
                content: null,
                recommendation: null
            });
        }

        // Extract ratings
        const imdbRating = parseFloat(movie.Ratings[0].Value) || 0;
        const metascore = parseFloat(movie.Ratings[2].Value) || 0;
        const rottenTomatoes = parseInt(movie.Ratings[1].Value) || 0;
        
        //Generate recommendation based on ratings
        const recommendation = getRecommendation(imdbRating, metascore, rottenTomatoes);
        res.render("index.ejs", {
            content: movie,
            recommendation: recommendation,
        });
    } catch (error) {
        console.log(error.message);
        res.render("index.ejs", {
            error: "Movie not found! Try searching another title.",
            content: null,
            recommendation: null
        });
    }
    
});

function getRecommendation(imdb, meta, rt) {
    const avgRating = (imdb * 10 + meta + rt) / 3;
    let recommendation;

    if (avgRating >= 70) {
        recommendation = {
            message: "🌟 Must-Watch! Highly Recommended!",
            details: "Critics and audiences love this movie. A top-tier experience!",
            class: "good"
        };
    } else if (avgRating >= 50) {
        recommendation = {
            message: "👍 Decent Movie. Worth Watching!",
            details: "It has mixed reviews, but if you enjoy the genre, give it a try.",
            class: "average"
        };
    } else {
        recommendation = {
            message: "👎 Not Recommended.",
            details: "Critics and audiences were not impressed. You might want to pick another movie.",
            class: "bad"
        };
    }
    return recommendation;
}

app.listen(port, () => {
    console.log(`Server running on port ${port}.`)
})
