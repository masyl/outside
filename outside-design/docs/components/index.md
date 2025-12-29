# Component Library

Documentation for UI and game components used in the Outside game.

## Overview

Our component library provides reusable, consistent elements for building the game interface.

## Component Categories

### UI Elements
Basic interface components like buttons, inputs, and navigation elements.

[View UI Elements →](/components/ui-elements)

### Game Components
Game-specific components like character cards, inventory items, and game boards.

[View Game Components →](/components/game-components)

## Design Principles

- **Consistency**: Components follow the same design patterns
- **Accessibility**: All components meet WCAG guidelines
- **Responsive**: Components work across different screen sizes
- **Customizable**: Components accept props for flexibility

## Usage

Components are built with TypeScript and follow our design system guidelines.

```typescript
import { Button } from '@outside/design';

<Button variant="primary" size="large">
  Start Game
</Button>
```

## Contributing

When adding new components:
1. Follow the existing component structure
2. Include TypeScript types
3. Add documentation and examples
4. Update this index

---

[← Back to Home](/)

