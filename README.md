# AI Arcade

A retro 90s arcade-inspired platform featuring 4 classic minigames built with React, TypeScript, and modern web tech.
Designed to feel like a classic desktop PyGame window but running globally via the web!

## Games Included
1. **Tic Tac Toe** (AI & Local Multiplayer)
2. **Connect 4** (AI & Local Multiplayer)
3. **Snake** (Single Player & Local 2-Player)
4. **Dots and Boxes** (AI & Local Multiplayer)

## Features
- Clean modular Architecture.
- Local Storage State Saving (`arcade-settings` and `arcade-stats`) replicating `.json` behavior.
- Minimax algorithms for difficulty options.
- Dynamic Retro Sound Engine via Web Audio API.

## Controls
- **Global**: Mouse for UI Navigation, Keyboard for specific games.
- **Snake (P1)**: Arrow Keys
- **Snake (P2)**: WASD
- **Pause (Snake)**: Esc / P

## Project Structure
- `src/scenes/` - State-managed views (MainMenu, GameSelect, Settings, Stats)
- `src/games/` - The core game logic components
- `src/components/` - Reusable UI (RetroButton, panels)
- `src/lib/` - Sound Engine and utils.
- `src/store.ts` - Local data persister (Stats, Settings)

## Running the App locally
Run `npm run dev` to start the app using Vite.

## Future Improvements
- WebSockets for Online Multiplayer.
- More complex AI heuristic evaluations.
- Support for mobile layout tuning (currently desktop-first).
