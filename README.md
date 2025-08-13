# Scoring League

A football match scoring and player management system built with Next.js and Supabase.

## Features

### Active Game Management
- **Real-time Game Timer**: Shows elapsed time in MM:SS format from match start
- **Live Score Tracking**: Click + buttons to increment scores for Team A and Team B
- **Match Controls**: Pause/resume timer, end match, and swap team sides
- **Team Management**: Add/remove players from teams with goalkeeper designation

### Player Management
- **Goalkeeper Selection**: Click on empty goalkeeper slots to assign players
- **Team Assignment**: Add players to teams with visual feedback
- **Player Removal**: Remove players from teams with ✕ buttons
- **Available Players**: Modal selection from active players not in current match

### UI Features
- **Responsive Design**: Works on desktop and mobile devices
- **Visual Team Distinction**: Blue for Team A, Red for Team B
- **Interactive Elements**: Hover effects and smooth transitions
- **Swedish Localization**: UI text in Swedish ("Målvakt", "Avsluta Match", etc.)

## Database Schema

The application uses the following Supabase tables:

- **matches**: Match information (start_time, end_time, status, winner_team)
- **players**: Player profiles (name, email, elo, is_active)
- **match_players**: Junction table linking players to matches with team assignment
- **scores**: Individual score records with timestamps and player attribution

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd scoring-league
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the migrations in `supabase/migrations/` to set up the database schema
   - Copy your project URL and anon key

4. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Starting a Match
To see the active game interface, you need to have:
1. An active match in the database (status = 'active')
2. Players assigned to teams via the match_players table
3. At least some players in the players table

### Managing Teams
- Click on "Ingen Målvakt" to assign a goalkeeper
- Use "+ Add Player" buttons to add field players
- Click ✕ to remove players from teams
- Use "Swap Sides" to switch all players between teams

### Scoring
- Click the blue + button to score for Team A
- Click the red + button to score for Team B
- Scores are automatically saved to the database

### Match Control
- Use the pause button to pause/resume the timer
- Click "Avsluta Match" to end the current match

## Technology Stack

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Supabase**: Backend-as-a-Service with PostgreSQL database
- **React Hooks**: State management and side effects

## Database Types

The application includes fully typed database interfaces generated from the Supabase schema, ensuring type safety throughout the application.

## Future Enhancements

- Drag-and-drop player management
- Real-time updates using Supabase subscriptions
- Match history and statistics
- Player performance analytics
- Tournament management
- Mobile app version
