# Floorball player stats website

CRUD application that is used by my team to track statistics across games and sessions. Available on [www.innebandy.pro](www.innebandy.pro).

Functionality includes:
- Automatic team assignments by scraping attendence reports.
- Tracking live results during a match.
- Entering events (goals / assists).
- Displaying results and player standings.
- User auth to show personal stats, and to modify profiles.
- (Future: smart team suggestions through elo-tracking and position balancing algorithm.)

### Tech
Nothing fancy - just utilizing convenient services and frameworks from Vercel and Supabase.

Most everything is vibe coded to get up and running fast. Please don't hack.

### TODO
Some jank regarding optimistic UI updates that can end up in an unsynchronized state.
Improved user experience through proper progress indicators during asynchronous actions, robust navigation, UI design and much more.
Implement ranking algorithm - probably a modified elo-based system adapted for teams.
Smart team assignment algortihm which takes player positions into account.
Remove all AI-slop throughout the project, including the other README files etc.

