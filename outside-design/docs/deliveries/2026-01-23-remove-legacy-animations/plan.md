# Remove Legacy Animations - Implementation Plan

## Problem Statement

The animation loop for bots is not well structured and does not take into account the new coordinate system. It also has a lot of weird behaviors that make the system difficult to maintain and extend.

## Root Cause Analysis

- Animation logic was built before coordinate system refactoring
- Inconsistent timing and state management in animation loop
- Complex coupling between animation and game state
- Poor separation of concerns between rendering and game logic

## Proposed Solution

Remove this old animation loop for now and move bots without smooth animated transitions. This will:

1. Simplify the codebase by removing complex animation logic
2. Ensure compatibility with the new coordinate system
3. Provide a stable foundation for future animation improvements
4. Eliminate weird behaviors and edge cases

## Implementation Plan

### Phase 1: Analysis and Documentation

- [x] Document current animation system behavior
- [x] Identify all animation-related code paths
- [x] Map dependencies and coupling points

### Phase 2: Legacy Code Removal

- [x] Remove animation loop logic
- [x] Clean up related state management
- [x] Remove unused animation utilities and helpers
- [x] Update bot movement to direct position updates

### Phase 3: Testing and Validation

- [x] Verify bot movement still works correctly
- [x] Test coordinate system compatibility
- [x] Ensure no performance regressions
- [x] Validate game logic remains intact

### Phase 4: Documentation Updates

- [x] Update API documentation
- [x] Document simplified movement system
- [x] Create migration notes for future animation work

## Success Criteria

- [x] Bots move correctly without animations
- [x] Coordinate system works as expected
- [x] No weird behaviors or edge cases
- [x] Code complexity reduced significantly
- [x] All tests pass
- [x] Performance maintained or improved

## Risk Assessment

**Low Risk**

- This is a removal of existing functionality
- Bot movement core logic will remain intact
- Can be easily rolled back if needed

**Mitigation**

- Comprehensive testing before and after
- Step-by-step removal with validation at each step
- Clear documentation of changes made

## Future Considerations

This change creates a clean slate for implementing a proper animation system in the future that:

- Integrates properly with the coordinate system
- Uses modern animation patterns
- Maintains clear separation of concerns
- Supports smooth transitions without coupling issues
