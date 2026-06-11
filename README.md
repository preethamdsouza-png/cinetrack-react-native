# 🎬 CineTrack

A sleek, high-performance movie tracking application built with **React Native**, **Expo**, and **TypeScript**. CineTrack interfaces directly with **The Movie Database (TMDB) API** to deliver real-time data on trending, upcoming, and top-rated cinema, wrapped in a beautifully tailored dark-mode UI.

---

## 🚀 Features Implemented

* **Custom Javascript Splash Screen:** Engineered a timed splash interaction that seamlessly transitions into the main application layout without layout flashes.
* **Hybrid Navigation Architecture:** Implemented an optimized navigation tree merging `native-stack` and `bottom-tabs` using **React Navigation**. Includes custom-styled active indicators and clean safe-area management on notched devices via `react-native-safe-area-context`.
* **Performance-Optimized UI (FlatList Hacks):** Crafted a complex Home Screen using a unified `FlatList` layout with structural `ListHeaderComponent` manipulation. This safely prevents nested vertical-scroll performance penalties, enabling a buttery-smooth 60fps experience for:
    * A dynamic horizontal trending carousel featuring heavy typography absolute ranking numbers.
    * An isolated category tab layout (Now Playing, Upcoming, Top Rated, Popular).
    * A high-performance 3-column movie grid.
* **Decoupled API Service Layer:** Built a fully-typed API networking layout leveraging **Axios instances**. It automatically injects required payloads globally via query parameters and leverages **Axios Interceptors** to log outbound network health directly to the console.
* **Strict Security Architecture:** Completely isolated sensitive API keys from the source code repository utilizing Expo’s native environment runtime (`.env` with `EXPO_PUBLIC_` prefixes) mapped explicitly against Git tracking rules.

---

## 🛠️ Tech Stack

* **Framework:** React Native (Expo Workflow)
* **Language:** TypeScript (Strict Type Definitions)
* **Networking:** Axios Client (with custom request interceptors)
* **Navigation:** React Navigation Suite (Stack, Bottom Tabs)
* **Layouts:** React Native Safe Area Context

---

## ⚙️ Project Architecture

```text
CineTrack/
├── src/
│   ├── components/     # Reusable UI molecules (e.g., SvgLoader)
│   ├── screens/        # Screen templates (HomeScreen, DetailScreen, etc.)
│   ├── services/       # Network logic layers (movieService.ts)
│   └── types/          # Global TS interfaces & strict
