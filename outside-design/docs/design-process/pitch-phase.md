# Pitch Phase

This phase focuses on transforming ideated concepts into formal, actionable proposals that can be implemented by the development team.

## Purpose & Philosophy

The Pitch Phase serves as the bridge between ideation and implementation planning. Inspired by Shape Up methodology, a pitch functions as a "work order" that frames the scope of development work without creating overly binding detailed requirements.

A pitch is written once we have a worthwhile idea from the ideation phase and need to formalize it for actual development work.

## When to Create Pitches

- After the ideation phase is complete
- When we have a worthwhile idea worth pursuing
- Before any implementation work begins
- As the first step in planning work for any system modification

## Pitch Format Requirements

Pitches must follow the standard template used throughout the project. Refer to existing pitches in the `/pitches/` directory for format examples.

Standard sections include:

- Title
- Motivation
- Solution
- Inclusions
- Exclusions
- Implementation Details (use sparingly)
- Pre-requisites
- Open Questions
- Next Logical Pitches

## Pitch Review Criteria

When reviewing a pitch in conversation with an AI agent, ensure it meets these criteria:

### Readability

- Can be understood by non-developers (Designers, Users, Testers, Analysts)
- Most of the pitch should be accessible without technical expertise
- Technical language should be used sparingly and with justification

### Implementation Details

- Should not specify technical implementation details unless they are crucial
- When technical details are included, they must come with clear justification
- Most implementation details should be drafted during the Planning step, not in the pitch

### Implementation Confidence

- The AI agent should feel confident in writing a good and detailed implementation plan from the pitch content
- The pitch should provide sufficient clarity and scope definition
- All critical aspects should be well-defined without being overly prescriptive

## AI Agent Review Process

1. **Initial Review**: AI agent evaluates the pitch against all review criteria
2. **Conversational Feedback**: Agent provides specific feedback on areas needing improvement
3. **Iterative Refinement**: Pitch is refined based on feedback until all criteria are met
4. **Final Approval**: Agent confirms the pitch is ready for implementation planning

## Pitch Modification After Work Begins

Once implementation work starts, the pitch should not be edited other than with explicit and visible amendments.

### Amendment Process

- Use strikethrough formatting for modified content
- Add a warning in the introduction: "This pitch was modified during implementation"
- Include a summary of the amendments made

### Purpose of Amendments

- Track which requirements were abandoned and for what reasons
- Provide reference for future pitch decisions
- Maintain transparency about scope changes during implementation

## Integration with Workflow

The Pitch Phase fits into the overall workflow as:

```
Research → Ideation → Pitch Phase → Planning → Implementation → Wrapup
```

- **Research Phase**: Understanding problems and user needs
- **Ideation Phase**: Generating creative concepts and exploring possibilities
- **Pitch Phase**: Framing scope of development work through structured work orders
- **Planning Phase**: Creating detailed implementation plans
- **Implementation Phase**: Building the feature
- **Wrapup Phase**: Documenting completed work

## Explicitly Excluded Elements

The following elements from Shape Up methodology are intentionally excluded from our current process:

- **Timeboxing**: Not needed due to project size and iteration speed
- **Appetite Setting**: Not necessary for our current workflow scale

These exclusions may be reconsidered if the project scale or team size changes significantly.

---

[← Back to Design Process](/design-process/)
