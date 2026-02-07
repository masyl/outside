# Wrapup process

## Description

The Wrapup involves completing all the documentation and reporting that ensures both humans and agents can quickly have a 360 view of a deliverable. This has the long term goals of keeping track of the projects evolution and the short term goal of easing any review process such as a pull request or creating release notes.

In short, plans are update one last time, testing and feature reports are written, the commit is prepared and recommendations can be added.

## When to do this

- **The Agent should never initiate wrapup automatically**
- Once all the coding and testing is complete.
- When the user confirms the coding and testing work is complete and asks for a wrapup.
- Remind the user to do the wrapup before merging the branch back into the main trunk.
- This is supposed to be done before closing the feature branch and included in the final merge and squash.

## Summary of steps to complete

1. Check pre-requisites for wrapping up
2. Create delivery folder
3. Update the plan
4. Testing report
5. Write delivery summary
6. Repatriate the original pitch
7. Prepare commit message
8. Add recommendations if needed

## Delivery Folder Structure

All the required documents created during the wrapup are added to the delivery folder, using the following structure:

```text
packages/outside-design/docs/deliveries/{YYYY-MM-DD-HHMM}-{descriptive-name}/
├── README.md     # Optional: additional context or notes
├── pitch.md      # The original pitch for this delivery.
├── plan.md       # Completed or ongoing implementation plan, to be used by the agent to prevent losing track of the objectives and communicate progress.
├── delivered.md  # A summary of what was actually delivered
├── testing.md    # A report on what automated tests and code coverage.
└── commit.md     # Prepared commit message for quick review
```

## Wrapup Steps

### 1. Check Pre-requisites for Wrapping Up

- Unit testing is completed and good coverage has been maintained.
- All tests are passing and no regressions have appeared.
- Build process is still passing green.
- The human has tested what could be tested and agreed it's time to wrapup.
- If features, requirements or testing is incomplete, the human acknowledge what was missing and confirms that a partial delivery is good enough.

### 2. Create Delivery Folder

- If the delivery document has not already been placed in the correct folder, create folder in `packages/outside-design/docs/deliveries/`
- Use format: `{YYYY-MM-DD-HHMM}-{descriptive-name}/`
- Example: `2024-01-08-1409-game-client-poc/`
- This folder contains all the wrapup documentation of the current delivery.

### 3. Update the Plan

- This step implies that an implementation plan was created and used by the agent.
- Create or update the plan document to reflect the end state of the delivery.
- If the scope has changed or if the implementation approach has changed, update the plan to reflect these changes.
- Check any todos that were already completed but leave incomplete todo's if they are still relevant.
- Add notes about deviations from the original plan

### 4. Testing Report

- Write a testing report that can be read in 5 minutes.
- Name this file `testing.md`.
- Include the following details:
  - What features or modules were tested or not tested
  - What was not tested
  - Metrics on passing tests and coverage.
  - Possible recommendations, if any, to improve tests for this delivery later on.

### 5. Delivery Report

- Write a delivery report that can be read in 5 to 10 minutes.
- Include the following details:
  - What is included in this delivery.
  - What is missing from the original plan.
  - Extras that were added after planning.
  - A very short summary of changes to the test coverage.
  - The logical next steps and next logical pitch.
  - Special mentions such as:
    - Architectural changes.
    - New dependencies added or removed.
    - Breaking changes to external APIs
- Save the report as "delivered.md" in the delivery folder.

### 6. Move the original pitch

- If not already done, move the original pitch document to the delivery folder and rename it `pitch.md`
- Candidate pitches are located in `packages/outside-design/docs/pitches/`
- Ideally, use the same pitch that initiated this work

### 7. Prepare a Commit Message and Tags

This document will be used when merging back to the trunk.

- Create `commit.md` with a prepared commit message
- The commit message should include:
  - Clear, concise title
  - Brief summary of changes
  - References to pitch or related work
  - Choose the tags that should be used for the merge commit
  - A tag that match the delivery slug
  - Any optional milestone tags related to planning or project management. (the agent should not invent those)

### 8. Create or update a README.md

- This is the index files for the delivery folder.
- It must include Frontmatter metadata and human readable details.
- In the frontmatter data, include:
  ```yaml
  ---
  title: Title of Delivery
  date: YYYY-MM-DD
  description: Brief description
  tags: [feature-tag, milestone]
  status: Done
  ---
  ```
- In the document body, include:
  - Title of the delivery
  - Date and time of completion
  - Original branch name and tag with a github link (use the tag)
  - Brief description of the motivation and solution (1-2 sentences)
  - A brief summary, in bullet form, of what was delivered.
  - Links to the other documents in the delivery folder (use relative path)

### 9. Update the list of deliveries

- Find the list of deliveries and update the document.
- If the list of deliveries is dynamic, ignore this step.
- Move the existing entry or add a new entry in the list.
- If the list is separated in sections, move the entry into a "Completed Plans" section
- Match the details already in the list.

## Completing the wrapup

Once the wrapup is completed, the agent should give a link to the user and ask for a quick review.

Once the review is done, offer to Merge the feature branch into the trunk according to the rules of the project (e.g. squash and merge).
