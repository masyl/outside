# Bot Autonomy

## Motivation

Bots are currently passive and can only act when directed by the player giving commands, step by step. To create a more vibrant and interesting world, bots should move on their own.

## Solution

Following an "agentic" approach, bots should have a growing level of autonomy on their own actions instead of being directly controlled.

In other words, they can issue their own commands in order to achieve goals.

This implies that the game loop should always be moving along step by step, even if no commands are issued.

* Bots are give the chance to issue commands at each step so that they can move by themselves
* By default, bots randomly choose to move up, down, left, right or simply don't move. Choosing to not move only 1/6th of the time.

## Pre-requisites

* A first instance of the oustide-server that run independently from the client.
* Concept of a seed to handle fake randomness.
