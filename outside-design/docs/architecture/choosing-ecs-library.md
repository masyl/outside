# Choosing an ECS Library

## Figuring out the problem first ...

Up to now, i was still a little unclear what part of the project should use an Object Oriented approach and where the line should be drawn for using a more Data Driven approach with the ECS pattern.

Both patterns have strength and weaknesses that make them almost fundamental opposites. By that I mean that if you would try to merge them into a single approach, you would probably get the worst of both, because the advantages come from what aspects of coding and computing has been optimized.

I have an intuition that when your dealing with complex systems that try to solve the same problems, but have been optimized through very divergent constraints, you usually can't fuse them and expect to get advantages of both. Actually, the only way to do this is to remove the constraints (For coding it would be speed, coupling, memory usage, bandwidth, etc.) to create a system that have the interfaces and external shape of both, but that ends up do delivering the advantages of any of them.

This is why I was looking more for the "domain boundaries" where Object Oriented (Ex.: Modern Web with React) would dominate on one side and Data Driven would dominate on the other side (ECS Pattern).

At the moment, the main boundary is between the game world simulation and the viewport rendering on one side with ECS and assembling this world simulator into an actual game App using modern web app development approached.

Where it get's funky, it that a lot of the RAD (Rapid Application Development) tooling I'm building, such as the debug panel and the time travel timeline sits on that fence and could be done in both. I initially coded them inside the game rendering, thinking that if the game get's ported it would be usefull to have this tooling as an integral part of the "creative mode" of the gamer. But now I see that its a premature move that puts too much design constraints and can "get in the way" of creating a very tight world simulation. 

Instead, I'm thinking that the best approach would be to build tooling that can "hook into" a running game world simnulation through well designed instrumentation and have external UIs expose the internals.

This improved decoupling and separation of concerns would give me:

- Less performance conflicts between debug tooling and the actual game.
- Simpler and faster development of the tooling (Agents are better at making React UI than ECS ui in Pixi, by a wide margin).
- A game world that is instrumented for remote control and detailed observation. This would come in very handy when trying to do integration testing and eventually having Agents manipulate the game.  
- Less issues when re-packaging the game without having to also bring in the tooling.

## Choosing The Library

All this mean that it's time for me to choose a proper ECS library before doing the next major refactroring.

For this, after doing some basic research on npm, I had an agent research and compile the list of libraries and do a comparative analysis on adoption metrics and key differences.

Here it is: [Typescript ECS Libraries Comparison](./typescript-ecs-libraries-comparison.md)

After reviewing all this, my choice ended up being [bitECS](https://github.com/NateTheGreatt/bitECS).

It has a strong low level approach, undeniable performance metrics and sustained efforts to maintain the project ... but also, the person behind it seems to have a worldview I respect a lot and align with.
