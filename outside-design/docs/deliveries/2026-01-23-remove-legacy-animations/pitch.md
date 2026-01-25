# Remove Legacy Animations Pitch

## Problem

The animation loop for bots is not well structured and does not take into account the new coordinate system. It also has a lot of weird behaviors.

## Solution

Remove this old animation loop for now and move bots without smooth animated transitions.

## Details

### Current Issues

- Animation system predates coordinate system refactoring
- Complex state management causing unpredictable behavior
- Tight coupling between animation and game logic
- Performance overhead from unnecessary animations
- Difficult to debug and maintain

### Benefits of Removal

- Immediate simplification of codebase
- Elimination of weird behaviors and edge cases
- Better compatibility with coordinate system
- Cleaner foundation for future animation implementation
- Improved maintainability

### Success Criteria

- Bots move correctly without animations
- No weird behaviors remain
- All existing functionality preserved
- Code complexity reduced

### Risk Assessment

**Low Risk**: This is a removal of existing functionality, not addition of new complexity. Core movement logic remains intact.
