# AI-Native Hybrid Search Engine Implementation

## Overview
The AISearchScreen implements an AI-native search engine powered by the local Gemma 4 model using the `react-native-litert-lm` inference engine. The screen interprets natural language user inputs and provides personalized movie recommendations with explanatory summaries.

## Architecture: Two-Pass Hybrid Flow

### Pass 1: Intent & Filter Extraction
**Goal:** Transform natural language queries into structured database search parameters.

**Process:**
1. User enters a query (e.g., "A tense 90s thriller that takes place in a rainy city")
2. Gemma processes the query using a strict JSON format system instruction
3. Extracts structured filters:
   - `tmdbKeywords`: 2-3 database-friendly keywords
   - `vibeBadges`: Array of mood/vibe descriptors
   - `maxRuntimeMinutes`: Optional runtime constraint

**System Prompt Template:**
```
Analyze this search query from a user looking for a movie on an OTT app: "${query}"
Extract search keywords suitable for a database query and identify visual/mood vibe badges.
Return ONLY valid JSON with this exact shape:
{
  "tmdbKeywords": "string of 2-3 database keywords",
  "vibeBadges": ["badge1", "badge2", "badge3"],
  "maxRuntimeMinutes": number or null
}
```

### Intermission: Database Fetch
**Goal:** Query TMDB API with extracted keywords.

**Process:**
1. Use `movieService.searchMovies()` with extracted `tmdbKeywords`
2. Apply optional runtime filter if specified
3. Slice results to top 3 matches (optimizes context window and latency)

### Pass 2: Re-Ranking & Personalization
**Goal:** Generate a conversational summary explaining why results match the user's mood.

**Process:**
1. Feed top 3 movie overviews + original query back to Gemma
2. Generate "Gemma's Take" - a 2-3 sentence personalized explanation
3. Display summary alongside movie results

**System Prompt Template:**
```
The user asked for: "${query}".
Review these database candidate matches and summarize why they fit the user's specific mood.
Candidates:
${candidateSummary}

Write a concise, enthusiastic, 2-3 sentence overview addressed directly to the viewer 
explaining how these selections perfectly bridge their request.
```

## Interactive Features

### Vibe Pills (Refinement Loop)
The search screen displays horizontally scrollable "Vibe Pills" representing active mood badges.

**Behavior:**
- **Active Pills:** Blue background with ✨ emblem
- **Inactive Pills:** Gray background, no emblem
- **Toggle Action:** Tapping a pill toggles its state
- **Refinement:** When pills are toggled, the app:
  1. Re-fetches movies from TMDB
  2. Automatically re-runs Pass 2 to update "Gemma's Take"

### User Journey Scenarios

**Scenario A: Direct Navigation**
User reads results → Clicks movie → Navigates to detail screen

**Scenario B: Refinement Mode**
User toggles vibe badges → Results refresh → Summary updates dynamically

## UI Components

### 1. Input Block
- Multi-line `TextInput` for natural language queries
- "Ask AI" button to trigger search
- Dark theme styling with placeholder text

### 2. Vibe Pills Row
- Horizontal `ScrollView` with pill badges
- Interactive toggle functionality
- Visual feedback for active/inactive states

### 3. Editorial Review Box
- Prominent callout card with blue accent border
- Displays "Gemma's Take" streaming text
- Loading indicator during summarization

### 4. Movie Feed
- Vertical `FlatList` of movie cards
- Poster images, titles, ratings, overviews
- Tap to navigate to detail screen

## Technical Implementation Details

### JSON Extraction Utility
```typescript
const extractJsonObject = (text: string): string | null => {
  // Handles markdown code blocks: ```json {...} ```
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlockMatch?.[1]) {
    return jsonBlockMatch[1].trim();
  }

  // Fallback: Extract raw JSON object
  const curlyBraceMatch = text.match(/\{[\s\S]*\}/);
  if (curlyBraceMatch?.[0]) {
    return curlyBraceMatch[0];
  }

  return null;
};
```

### Memory Optimization
- **Cleanup on Unmount:** `abortRef` prevents state updates after unmount
- **Model Management:** Leverages `GemmaProvider` for centralized model lifecycle
- **Context Window:** Limits results to 3 movies to save compute and improve latency

### State Management
```typescript
type SearchState = 'idle' | 'extracting' | 'fetching' | 'summarizing' | 'complete' | 'error';
```

States drive UI transitions:
- `idle`: Initial state, ready for input
- `extracting`: Pass 1 in progress
- `fetching`: Querying TMDB
- `summarizing`: Pass 2 generating review
- `complete`: Results displayed
- `error`: Error state with retry option

## Integration Points

### Navigation Setup
```typescript
// App.tsx
<GemmaProvider>
  <Stack.Navigator>
    <Stack.Screen name="AISearch" component={AISearchScreen} />
  </Stack.Navigator>
</GemmaProvider>
```

### Entry Point
Added "Try AI-Powered Search" button in `SearchScreen.tsx`:
- Blue button with ✨ icon
- Navigates to AISearchScreen
- Located below search input bar

## Error Handling

1. **Model Initialization Errors:**
   - Displays error message if Gemma fails to load
   - Shows model path and backend information when available

2. **Pass 1 Failures:**
   - JSON extraction safeguards
   - Validation of required fields
   - User-friendly error messages

3. **TMDB API Errors:**
   - Catches network failures
   - Displays error with retry option

4. **Pass 2 Failures:**
   - Fallback to empty review
   - Maintains movie results display

## Performance Considerations

1. **Top 3 Results:** Minimizes token usage and speeds up Pass 2
2. **Abort on Unmount:** Prevents memory leaks from in-flight requests
3. **Keyboard Dismiss:** Improves UX by hiding keyboard on search
4. **Debounced Refinement:** Pill toggles trigger immediate refresh (no debounce needed due to local execution)

## File Structure

```
src/
├── screens/
│   └── AISearchScreen.tsx          # Main implementation
├── llm/
│   └── GemmaProvider.tsx            # Model context provider
├── services/
│   └── movieService.tsx             # TMDB API integration
└── types/
    └── Movie.tsx                    # Movie type definitions
```

## Usage Example

```typescript
// Navigate from any screen
navigation.navigate('AISearch');

// Example query
"A tense 90s thriller that takes place in a rainy city"

// Expected flow:
// 1. Extract: { tmdbKeywords: "thriller 90s rainy", vibeBadges: ["Tense", "Dark", "Urban"] }
// 2. Fetch: Top 3 thrillers from TMDB
// 3. Summarize: "These selections perfectly capture that gritty urban tension..."
```

## Future Enhancements

1. **Streaming Responses:** Display token-by-token generation for Pass 2
2. **History:** Save previous searches for quick access
3. **Advanced Filters:** Date ranges, genre preferences, actor/director search
4. **Multi-Modal:** Image-based search integration
5. **Personalization:** Learn user preferences over time

## Dependencies

- `react-native-litert-lm`: Local Gemma 4 inference
- `@react-navigation/native`: Screen navigation
- `axios`: TMDB API requests
- `react-native-safe-area-context`: Safe area handling

## Testing Recommendations

1. **Unit Tests:**
   - `extractJsonObject()` with various formats
   - State transition logic
   - Pill toggle refinement flow

2. **Integration Tests:**
   - Full search flow from query to results
   - Error handling scenarios
   - Navigation integration

3. **E2E Tests:**
   - User enters query → Sees results
   - Toggle pills → Results refresh
   - Click movie → Navigate to detail

## Troubleshooting

### Model Not Loading
- Verify Gemma model file exists at configured path
- Check backend (GPU/CPU) compatibility
- Review `GemmaProvider` initialization logs

### JSON Extraction Failures
- Gemma may wrap JSON in markdown
- `extractJsonObject()` handles both formats
- Log raw responses for debugging

### No Results
- Check TMDB API key configuration
- Verify network connectivity
- Review extracted `tmdbKeywords` relevance

## License & Credits

Implementation follows the specification requirements for an AI-native hybrid search engine using local Gemma 4 model inference.
