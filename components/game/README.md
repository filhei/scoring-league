# Game Components

This directory contains the refactored game components that were extracted from the original `ActiveGame.tsx` file to improve maintainability and fix drag and drop functionality.

## Components

### `DragImage.tsx`
- Displays a custom drag image that follows the cursor during drag operations
- Shows player name and stats while dragging
- Handles dark mode styling

### `DropPlaceholder.tsx`
- Renders a placeholder indicating where a player will be dropped
- Shows during drag operations to provide visual feedback
- Styled with dashed borders and blue accent colors

### `GameControls.tsx`
- Contains all game control elements: timer, score display, pause/resume, end match button
- Handles team swapping functionality
- Manages score increment buttons for both teams

### `GoalkeeperTile.tsx`
- Specialized component for goalkeeper display
- Handles goalkeeper-specific functionality (can't be dragged)
- Shows "Add Goalkeeper" state when no goalkeeper is assigned

### `PlayerTile.tsx`
- Individual player tile component with drag functionality
- Displays player name and stats
- Handles remove player functionality
- Supports drag and drop operations

### `TeamDisplay.tsx`
- Container component that manages a team's display
- Handles drag and drop zone functionality
- Renders goalkeeper and field players with proper ordering
- Manages drop placeholders during drag operations

## Hooks

### `useDragAndDrop.ts` (in `lib/hooks/`)
- Custom hook that encapsulates all drag and drop logic
- Manages drag state, mouse position tracking, and drop calculations
- Handles drag event listeners and cleanup
- Provides clean API for drag and drop operations

## Benefits of Refactoring

1. **Separation of Concerns**: Each component has a single responsibility
2. **Reusability**: Components can be easily reused in other parts of the application
3. **Maintainability**: Easier to debug and modify individual components
4. **Testability**: Each component can be tested in isolation
5. **Readability**: Code is more organized and easier to understand
6. **Fixed Drag and Drop**: The broken drag and drop functionality has been properly implemented

## Usage

The main `ActiveGame.tsx` component now uses these smaller components to create a cleaner, more maintainable codebase. The drag and drop functionality is now properly separated into its own hook, making it easier to debug and improve. 