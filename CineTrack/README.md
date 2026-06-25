# CineTrack 🎬

A modern React Native movie tracking application built with Expo that helps you discover, explore, and manage your favorite movies.

## Features ✨

### 🏠 Home Screen
- Browse popular and trending movies
- Curated movie collections and categories
- Beautiful hero sections with movie posters and backdrops

### 🔍 Search
- Real-time movie search powered by TMDB API
- Search by title, genre, or year
- Instant results with movie posters and ratings

### 📋 Watchlist
- Save movies to your personal watchlist
- Persistent local storage using SQLite
- View saved movies with detailed information
- Auto-refresh when navigating to the watchlist

### 🎥 Movie Details
- Comprehensive movie information:
  - Title, release year, and runtime
  - User ratings and reviews
  - Plot overview
  - Genre and category information
  - High-quality poster and backdrop images
- Tabbed interface with:
  - **About Movie**: Full plot synopsis
  - **Reviews**: User reviews with ratings and avatars
  - **Cast**: Cast members with profile images in a grid layout
- Bookmark/unbookmark movies with optimistic UI updates
- Smooth navigation with back button

### 📸 Scan Poster
- Camera integration for poster scanning
- AI-powered poster recognition using on-device LLM (Gemma)
- Automatic calendar event creation from movie posters
- Extract movie information from physical posters

## Tech Stack 🛠️

### Core
- **React Native** (0.85.3) - Mobile app framework
- **Expo** (56.x) - Development platform
- **TypeScript** (6.0.3) - Type safety

### Navigation
- **React Navigation** (v7)
  - Bottom tabs for main navigation
  - Native stack navigator for screen transitions

### Data & Storage
- **Expo SQLite** - Local database for bookmarks
- **Axios** - HTTP client for API requests
- **TMDB API** - Movie data source

### UI Components
- **React Native SVG** - Custom icons and graphics
- **React Native Safe Area Context** - Handle device notches and safe areas

### AI/ML
- **React Native LiteRT LM** (Gemma) - On-device language model
- **React Native Vision Camera** - Camera integration for poster scanning

### Other Features
- **Expo Calendar** - Calendar integration for movie events
- **Expo Image Manipulator** - Image processing
- **Expo File System** - File management

## Project Structure 📁

```
CineTrack/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx          # Home page with movie collections
│   │   ├── SearchScreen.tsx        # Movie search functionality
│   │   ├── WatchlistScreen.tsx     # User's saved movies
│   │   ├── DetailScreen.tsx        # Movie details with tabs
│   │   ├── ScanPosterToEventInCalender.tsx  # Poster scanning
│   │   └── SplashScreen.tsx        # App splash screen
│   ├── components/
│   │   └── SvgLoader.tsx           # SVG icon loader
│   ├── services/
│   │   └── movieService.tsx        # TMDB API integration
│   ├── db/
│   │   └── bookmarkDB.tsx          # SQLite database operations
│   ├── hooks/
│   │   └── handleBookmarks.tsx     # Bookmark management hook
│   ├── llm/
│   │   └── GemmaProvider.tsx       # LLM provider for AI features
│   └── types/
│       ├── Movie.ts                # Movie type definitions
│       └── MovieDetail.ts          # Movie detail type definitions
├── App.tsx                         # App entry point with navigation
└── README.md
```

## Getting Started 🚀

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CineTrack
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up TMDB API Key**
   
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
   ```
   
   Get your API key from [The Movie Database (TMDB)](https://www.themoviedb.org/settings/api)

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on your device**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan the QR code with Expo Go app on your physical device

## Development 💻

### Available Scripts

```bash
# Start development server
npx expo start

# Start with cache cleared
npx expo start --clear

# Build for iOS
npx expo run:ios

# Build for Android
npx expo run:android
```

## Key Features Implementation 🔑

### Bookmark Management
- Uses SQLite for persistent local storage
- Implements optimistic UI updates for instant feedback
- Auto-refreshes watchlist on screen focus using `useFocusEffect`
- Handles race conditions with proper state management

### Movie Details
- Three-tab interface (About, Reviews, Cast)
- Overlapping poster design for visual appeal
- Rating badges with star icons
- Responsive grid layout for cast members

### Search
- Debounced search for performance
- Real-time results from TMDB API
- Handles empty states and loading states gracefully

### Movie Poster Scanning with Gemma LLM
- **On-Device AI Processing**: Uses Google's Gemma open-weight LLM model running locally on the device
- **Camera Integration**: Real-time camera access via React Native Vision Camera
- **Poster Recognition**: AI-powered extraction of movie information from physical posters
- **Multi-Modal Understanding**: Gemma LLM analyzes poster images to identify:
  - Movie title
  - Release date
  - Cast members
  - Genre information
  - Key visual elements
- **Calendar Event Creation**: Automatically creates calendar events with extracted movie details
- **Image Processing Pipeline**:
  1. Capture poster image using device camera
  2. Process and optimize image with Expo Image Manipulator
  3. Feed processed image to Gemma LLM model
  4. Parse and extract structured movie data
  5. Create calendar event with movie showtime details
- **Privacy-First**: All processing happens on-device without sending data to external servers
- **LiteRT Integration**: Uses React Native LiteRT for efficient on-device inference
- **Offline Capable**: Works without internet connection for poster scanning

**Technical Implementation:**
- Model: Gemma LLM (open-weight model from Google)
- Runtime: LiteRT (TensorFlow Lite Runtime) for mobile optimization
- Vision: React Native Vision Camera for high-quality image capture
- Processing: Expo Image Manipulator for image preprocessing
- Storage: Expo File System for temporary image caching

### UI/UX
- Dark theme with modern color palette
- Custom SVG icons throughout the app
- Smooth animations and transitions
- Proper touch target sizes (44x44px minimum)
- Safe area handling for all device types

## API Integration 🌐

### TMDB API Endpoints Used
- `/movie/popular` - Popular movies
- `/movie/{id}` - Movie details
- `/search/movie` - Search movies
- `/movie/{id}/credits` - Cast information
- `/movie/{id}/reviews` - User reviews

## Performance Optimizations ⚡

- Memoized callbacks with `useCallback`
- Memoized values with `useMemo`
- Optimistic UI updates for bookmarks
- Lazy loading of images
- FlatList for efficient rendering of large lists
- Debounced search input


## License 📄

This project is licensed under the MIT License.

## Acknowledgments 🙏

- [The Movie Database (TMDB)](https://www.themoviedb.org/) for the movie data API
- [Expo](https://expo.dev/) for the development platform
- React Native community for excellent libraries and tools

## Contact 📧

For questions or support, please open an issue in the repository.

---

**Built with ❤️ using React Native and Expo**
