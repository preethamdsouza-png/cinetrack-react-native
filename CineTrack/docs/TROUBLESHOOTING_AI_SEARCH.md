# AI Search Troubleshooting Guide

## Common Issues and Solutions

### Issue: API Not Returning Results

**Symptoms:**
- TMDB API query shows in logs but returns no results
- Query params contain comma-separated keywords like: `"action movie, thriller, best"`

**Root Cause:**
The Gemma model may generate comma-separated keywords, but TMDB's search API expects space-separated keywords for optimal results.

**Solution Implemented:**
1. **Updated Pass 1 Prompt:** Now explicitly instructs Gemma to return space-separated keywords
2. **Keyword Cleaning Function:** Automatically removes commas and normalizes spacing
3. **Fallback Logic:** Double-cleans keywords before sending to TMDB API

**Example Fix:**
```typescript
// Before: "action movie, thriller, best"
// After:  "action thriller best"

const cleanKeywords = (keywords: string): string => {
  return keywords
    .replace(/,/g, ' ')        // Remove commas
    .replace(/\s+/g, ' ')      // Normalize multiple spaces
    .trim()                     // Remove leading/trailing spaces
    .split(' ')
    .slice(0, 4)               // Limit to 4 keywords max
    .join(' ');
};
```

### Issue: Gemma Returns Invalid JSON

**Symptoms:**
- "Failed to extract JSON from Gemma response" error
- Model wraps JSON in markdown code blocks

**Solution:**
The `extractJsonObject()` function handles both formats:
```typescript
// Handles: ```json {...} ```
// Handles: {...}
```

**Debug Steps:**
1. Check console logs for "🤖 Gemma Raw Response"
2. Verify JSON structure matches expected format
3. Look for markdown wrapping or extra text

### Issue: No Movies Found Despite Valid Search

**Symptoms:**
- Keywords look correct
- TMDB API returns empty array
- "No matching movies found" message

**Possible Causes:**
1. **Keywords too specific:** Try broader terms
2. **Unusual combinations:** TMDB may not have matches
3. **API rate limiting:** Wait and retry

**Solutions:**
1. Simplify the query
2. Toggle off some Vibe Pills
3. Try different wording

**Example Good Queries:**
- "thriller detective" ✅
- "romantic comedy" ✅
- "sci-fi space" ✅

**Example Problematic Queries:**
- "ultra-specific niche genre with exact plot" ❌
- "movie about very specific rare topic" ❌

### Issue: Model Loading Failure

**Symptoms:**
- "Gemma model not available" error
- "Failed to initialize Gemma" message

**Debug Steps:**
1. Check if model files exist at configured paths:
   - `/data/local/tmp/gemma-4-E2B-it.litertlm`
   - `/data/local/tmp/llm/gemma_multimodal.litertlm`

2. Verify backend availability (GPU/CPU)
3. Check device memory and close other apps
4. Review GemmaProvider logs in console

**Solutions:**
- Ensure model files are properly downloaded
- Try CPU backend if GPU fails
- Restart the app
- Free up device memory

### Issue: Slow Performance

**Symptoms:**
- Long wait times during extraction
- UI feels sluggish
- App becomes unresponsive

**Causes:**
1. First-time model loading (one-time cost)
2. Complex queries requiring more tokens
3. Device memory constraints
4. Multiple apps running

**Solutions:**
1. **First Search:** Will always be slower (model loading)
2. **Subsequent Searches:** Should be much faster
3. **Device Optimization:**
   - Close background apps
   - Ensure adequate free RAM
   - Try simpler queries first

**Performance Benchmarks:**
- Model Loading: 2-5 seconds (first time only)
- Pass 1 (Extraction): 1-3 seconds
- TMDB Fetch: 0.5-1 second
- Pass 2 (Summary): 2-4 seconds
- **Total:** ~6-13 seconds for complete flow

### Issue: Vibe Pills Not Refining Results

**Symptoms:**
- Toggling pills doesn't change results
- Same movies appear regardless of active pills

**Root Cause:**
The current implementation filters at the TMDB level using the original keywords, not the vibe badges themselves.

**Expected Behavior:**
- Toggling pills triggers new TMDB search
- Pass 2 regenerates with new context
- Movies should update based on available matches

**If Results Don't Change:**
1. Check if TMDB has limited matches for those keywords
2. Try a completely new search query
3. Verify console logs show new fetch requests

### Debug Logging Reference

The implementation includes comprehensive logging for troubleshooting:

```
🤖 Gemma Raw Response: [full model output]
📋 Extracted JSON: [cleaned JSON string]
🔧 Parsed Filters (before cleaning): [parsed object]
✨ Keywords cleaned: "original" → "cleaned"
🔍 Searching TMDB with cleaned keywords: [final keywords]
🌐 --- AXIOS REQUEST OUTBOUND --- [TMDB API call]
```

**How to Use Debug Logs:**
1. Open React Native debugger or console
2. Trigger a search
3. Follow the emoji trail to see each step
4. Identify where the flow breaks or produces unexpected output

### Keyword Cleaning Examples

| Original Keywords | Cleaned Keywords | Notes |
|------------------|------------------|-------|
| `"action, thriller, best"` | `"action thriller best"` | Commas removed |
| `"sci-fi   space    movie"` | `"sci-fi space movie"` | Multiple spaces normalized |
| `"  detective  noir  "` | `"detective noir"` | Leading/trailing spaces trimmed |
| `"one two three four five"` | `"one two three four"` | Limited to 4 keywords |

### Best Practices for Reliable Results

1. **Use Descriptive Queries:**
   - Good: "tense psychological thriller with twist ending"
   - Bad: "good movie"

2. **Include Genre Hints:**
   - Good: "romantic drama in Paris"
   - Bad: "movie about love"

3. **Add Context:**
   - Good: "90s action thriller with car chases"
   - Bad: "action"

4. **Be Specific but Not Too Narrow:**
   - Good: "space sci-fi with alien encounter"
   - Bad: "sci-fi movie about exactly 7 astronauts meeting blue aliens on Mars in 2045"

### When to Contact Support

If you experience:
- Consistent crashes when using AI Search
- Repeated model loading failures
- Unexpected behavior not covered here
- API errors that persist after multiple retries

Provide:
- Device model and OS version
- Full console logs
- Query that caused the issue
- Screenshot of error message

### Advanced Debugging

For developers troubleshooting implementation issues:

1. **Check Pass 1 Output:**
```typescript
// Add breakpoint in executePass1 after parsing
console.log('Parsed Filters:', parsed);
```

2. **Verify TMDB Response:**
```typescript
// Add logging in fetchMoviesFromTMDB
console.log('TMDB Results Count:', allResults.length);
console.log('First Result:', allResults[0]);
```

3. **Monitor Pass 2 Input:**
```typescript
// Add logging in executePass2
console.log('Candidate Summary:', candidateSummary);
```

4. **Test Keyword Cleaning:**
```typescript
// Test the function directly
console.log(cleanKeywords("action, movie, thriller, best"));
// Expected: "action movie thriller best"
```

### Quick Fixes Checklist

- [ ] Model files exist at configured paths
- [ ] Device has adequate free memory (>2GB recommended)
- [ ] TMDB API key is valid (check movieService.tsx)
- [ ] Network connection is stable
- [ ] Query is descriptive enough (3+ words)
- [ ] Keywords are being cleaned (check logs)
- [ ] No other heavy apps running in background
- [ ] App has been restarted if first time using AI Search

---

**Last Updated:** Implementation v1.0  
**Related Docs:** AI_SEARCH_IMPLEMENTATION.md, AI_SEARCH_QUICK_START.md
