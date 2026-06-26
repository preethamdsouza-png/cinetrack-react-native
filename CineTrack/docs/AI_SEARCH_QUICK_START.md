# AI Search Quick Start Guide

## What is AI Search?

AI Search is an AI-native search engine that understands natural language queries and provides personalized movie recommendations with conversational explanations.

## How to Access

1. Open the app and navigate to the **Search** tab
2. Tap the **"Try AI-Powered Search"** button (blue button with ✨ icon)
3. You'll be taken to the AI Search screen

## How to Use

### Step 1: Enter Your Query
Type a natural language description of what you're looking for. Be specific about:
- **Mood/Vibe:** "tense", "uplifting", "dark", "romantic"
- **Era:** "90s", "classic", "modern", "retro"
- **Setting:** "rainy city", "space", "small town", "desert"
- **Genre hints:** "thriller", "comedy", "sci-fi", "drama"

**Examples:**
- "A tense 90s thriller that takes place in a rainy city"
- "Uplifting comedy from the 80s with a happy ending"
- "Dark sci-fi movie set in space with a small crew"
- "Romantic drama in Paris with beautiful cinematography"

### Step 2: Tap "Ask AI"
The AI will:
1. Analyze your query
2. Extract search keywords and vibe badges
3. Search the movie database
4. Generate a personalized explanation

### Step 3: Review Results
You'll see:
- **Vibe Pills:** Badges representing the mood/themes extracted from your query
- **Gemma's Take:** A personalized 2-3 sentence explanation of why these movies match your request
- **Movie Cards:** Top 3 matching movies with posters, ratings, and overviews

### Step 4: Refine (Optional)
Tap on any **Vibe Pill** to toggle it on/off:
- **Active Pills:** Blue background with ✨
- **Inactive Pills:** Gray background

When you toggle pills, the results and explanation automatically update to match your refined preferences.

### Step 5: Select a Movie
Tap any movie card to view full details and add to your watchlist.

## Tips for Best Results

### ✅ DO:
- Be descriptive about mood and setting
- Mention specific time periods if important
- Describe the feeling you want ("tense", "lighthearted", "emotional")
- Use multiple descriptors ("dark rainy thriller")

### ❌ DON'T:
- Search for specific titles (use regular search for that)
- Use very generic queries ("good movies")
- Enter just genre names ("action") - add context!

## Example Queries

### Mystery/Thriller
```
"A psychological thriller with unreliable narrators and plot twists"
"Murder mystery set in a mansion during a storm"
"Tense detective story in a noir style"
```

### Sci-Fi/Fantasy
```
"Mind-bending sci-fi about time travel with philosophical themes"
"Epic space opera with large-scale battles"
"Dystopian future with a strong female lead"
```

### Drama/Romance
```
"Emotional coming-of-age story set in the 1950s"
"Romantic drama in Italy with stunning visuals"
"Family drama exploring relationships across generations"
```

### Comedy
```
"Witty British comedy with dry humor"
"Feel-good comedy about friendship and second chances"
"Dark comedy with satirical take on corporate culture"
```

## Understanding the Results

### Vibe Pills
These represent the mood/theme tags extracted from your query:
- **Tense:** High-stakes, suspenseful
- **Dark:** Serious tone, mature themes
- **Urban:** City setting
- **Retro:** Period piece, nostalgic
- **Uplifting:** Positive, feel-good
- **Emotional:** Deep feelings, character-driven

### Gemma's Take
A personalized explanation written just for you by the AI, explaining:
- Why these specific movies match your request
- How they capture the mood you described
- What makes them a good fit for your current viewing preference

### Movie Cards
Each card shows:
- **Poster:** Official movie poster
- **Title:** Full movie title
- **Rating:** ★ rating from 0.0 to 10.0
- **Year:** Release year
- **Overview:** Brief plot summary

## Troubleshooting

### "Gemma model not available"
The AI model is still loading. Wait a few seconds and try again.

### "No matching movies found"
Try:
1. Using different keywords
2. Being less specific about time period or setting
3. Toggling some vibe pills off
4. Trying a completely different query

### Results don't match my query
Use the **Vibe Pills** to refine:
- Turn off badges that don't fit
- Keep only the most important mood descriptors
- Try a new search with clearer wording

### App is slow
The AI runs locally on your device:
- First search may take longer (model loading)
- Subsequent searches are faster
- Close other apps for better performance

## Technical Details

- **Model:** Local Gemma 4 via react-native-litert-lm
- **Database:** TMDB (The Movie Database)
- **Results:** Top 3 most relevant matches
- **Privacy:** All AI processing happens on your device

## Need More Help?

- Check the full documentation in `AI_SEARCH_IMPLEMENTATION.md`
- Report issues or suggest features to the development team
- For standard title/actor searches, use the regular Search tab

---

**Happy searching! 🎬✨**
