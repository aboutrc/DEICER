# Component Checkpoints

This directory contains checkpoints of components that can be used to roll back to a previous state after testing new features.

## Available Checkpoints

- `MapDebug-checkpoint.tsx`: Checkpoint of the MapDebug component with full functionality including:
  - Debug information panel
  - Marker placement and management
  - Location search
  - University selection
  - Category selection dialog
  - Error handling

## How to Use

To restore a component from a checkpoint:

1. Copy the checkpoint file to the original component location:
   ```
   cp src/checkpoints/MapDebug-checkpoint.tsx src/components/MapDebug.tsx
   ```

2. Restart the development server if needed:
   ```
   npm run dev
   ```

## Creating New Checkpoints

To create a new checkpoint of a component:

1. Copy the component file to the checkpoints directory with a descriptive name:
   ```
   cp src/components/ComponentName.tsx src/checkpoints/ComponentName-checkpoint.tsx
   ```

2. Add documentation to this README.md file about the checkpoint.