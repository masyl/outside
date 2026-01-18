# Deliveries

## What are Deliveries?

Deliveries are similar to the concept of feature-branches, but with additionnal steps to help get the most out of collaborating with coding agents and other humans, include your future self.

The premise is simple:

1. **Chat input sucks:** Communicating requirements to an agent through a chat box is just as error prone as giving verbal instructions to a human.
2. **Agents read fast**: Agents are extremely fast at reading and writing good documentation.
3. **Pobodies Nerfect:** Both humans and coding agents can get lost very quickly during software developement. And a lot of the same problem we have with "human + human" collaboration also happen when working with agents.

This is why this approach with deliveries tries to recreate a lot of proven good practices, but adapted to a fast work loop with coding agents.  

## When does a change should become a delivery

Signs that a change should go through a formal delivery:

- A new feature is being added
- An architectural change
- Major improvements to performance or code quality
- Changes that require to track multiple steps or require houres of Human/Agent collaboration
- Something that is long or difficult to explain over a chat message

## The Basic

- Branch: Always work in a feature branch
- Pitch: Write a pitch first, that follows guidelines
- Document: Keep all the documentation specific to this delivery into its own folder. Permanently.
- Plan: Create a written plan, that includes todos, in a ,markdown document.
- Implement: Follow the plan!
- Test: Make sure everything is unit tested before delivering.
- Wrapup: A robust step of documentations and reporting to improve understanding.

## About the documentation

For details on the documentation folder, lookup the [wrapup process](./wrapup.md).
