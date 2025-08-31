# Poängliga

Ett fotbollsmatcher poängsystem och spelarhantering byggt med Next.js och Supabase.

## Funktioner

### Aktiv Matchhantering
- **Realtids Matchtimer**: Visar förfluten tid i MM:SS format från matchstart
- **Live Poängspårning**: Klicka + knappar för att öka poäng för Lag A och Lag B
- **Matchkontroller**: Pausa/återuppta timer, avsluta match och byt lagsidor
- **Laghantering**: Lägg till/ta bort spelare från lag med målvaktsdesignation

### Spelarhantering
- **Målvaktsval**: Klicka på tomma målvaktsslott för att tilldela spelare
- **Lagtilldelning**: Lägg till spelare i lag med visuell feedback
- **Spelarborttagning**: Ta bort spelare från lag med ✕ knappar
- **Tillgängliga Spelare**: Modalt val från aktiva spelare som inte är i nuvarande match

### UI-funktioner
- **Responsiv Design**: Fungerar på desktop och mobila enheter
- **Visuell Lagdistinktion**: Blå för Lag A, Röd för Lag B
- **Interaktiva Element**: Hover-effekter och smidiga övergångar
- **Svensk Lokalisering**: UI-text på svenska ("Målvakt", "Avsluta Match", etc.)

## Databasschema

Applikationen använder följande Supabase-tabeller:

- **matches**: Matchinformation (start_time, end_time, status, winner_team)
- **players**: Spelarprofiler (name, email, elo, is_active)
- **match_players**: Kopplingstabell som länkar spelare till matcher med lagtilldelning
- **scores**: Individuella poängposter med tidsstämplar och spelartilldelning

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
