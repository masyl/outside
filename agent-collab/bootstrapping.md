
# Self-hosting and Bootstrapping Outside

Programming languages are said to become self-hosting when they can compile themselves, thus not needed a host language to be compiled. They gain this caracteristicc by a process called bootstraping. While the are initially created, they rely on previous languages and technologies, until they can be independent.

One core goal of the Outside architecture is to go through a similar process and bring "inside the game runtime" all the elements that are typically created using a parent platform. The ECS mechanic at the core of this architecture is the first aspect that needs to be hoisted out of typescript and converted into game assets and entities, so that only the minimal structure and bindings are left to the runtime host.

It is to be expected that many primitive capabilities will not be able to be bootstrap for the moment, and some will never be the territory of the simulation itself. But the more we can self-host, the more capable the platform will be and the more portable the experiences built on it will be.


## Recursive ECS

The first system that is apt to be self hosted is the ECS assets. While the ECS library itself will need to be provided by the host, all the parts that are fed into the ECS library can themselves be mapped to ECS Entities and offer an extreme type of composability and dynamism.

Systems, Components and Prefabs can all be defined in formats like Lua and JSON, and then be onboarded into the simulation as entities. As these ECS entities are added to a running simulation, the ECS loop itself would then include them in the execution of the loop.

While many of the core systems can be initially coded inside the project, they will have to be put into an intermediate asset/entity store and then loaded dynamically. From there, adding additionnal systems, components and prefabs is just a matter of adding assets to the store. Eventually, an collection of Outise simulations will also be able to create those entities directly.

For example, a "system editor" could allow the creation of "blank systems", then show a small editor to add the LUA script and give all the needed toggles, attributes and config knobs. From there, the moment the entity is persisted, it becomes a reusable asset that can be loaded anywhere an Outside simulation is running.

## Current limitations on what can be self-hosted

## Momentary limitations

### Telnet/VT100 terminals

Outside will have terminal emulators (Telnet/VT100) as a core capability. This is as much for enabling direct communication with online systems as it will allow the creation of experiences that are "more than games".

Also, giving creators a rich set of commands through REPL interfaces to interact with the world of Outside is a "must have". It can be a "dev tool" just as much as a gameplay element.

Terminal emulators are a very sequential concept that would not profit much from being implemented in an ECS loop. It's not "impossible", but good Lua implementations are available since it is a well standardised and fully open technology. We can expect to find a standard and portable implementation. From there, it's a matter of replacing the rendering of letters by the display of sprites instead of TrueType fonts.

The extraction of classic DOS/BIOS fonts into sprites is already ongoing and has proven to be simple enough.

Where the terminal could profit from being integrated in an ECS based engine, is in the assemblage of multiple emulators to create more complex UIs like TMUX and the recently popular concept of TUIs that bring back the concept of text based, but rich interactive UIs.

## Permanent Limitations

### Physics engine

Creating a new physics engine in pure lua has not been done in any credible way and it is unlikely that the performance challenges would be easy enough top address.

At the moment, the plan is to adopt Jolt Physics. For the web runtime, there is a typescript port with decent performances. For compiled apps, the core C++ library has bindings for C, C#, Java/Kotlin, JavaScript, Rust, Python, Zig. Making it an ideal candidate for a fully portable approach.

Since the 2d and 3d physics needed for 2.5d bitmap games is only a smaller subset of what libraries like Jolt offer, it is trivial to create an API for the needed primitives and not have to expose Outside users to the full complexity of a full 3D gaming engine. 

### Hardware

Maby aspects of a game or interactive experience relies on contact with the hardware.

Such as:

* Networking
* Audio/Sound
* Controllers (game remote, midi)
* Microphones
* 3D accelerated rendering

All of these aspects will require the host runtime to provide the capabilities. The main challenge will be to choose libraries that have already been made available to compiled languages and the web. Having different uderlying libraries between the web, and each languages would make the simulations too different accross platforms and break the extreme portability and testability.

The goal is not to pack as much capabilities as possible, but rather to provide the kind of primitives that will be easily composable and still run smoothly on underpowered hardware such as handheld emulators and older mobile devices. 

These capabilities will have to be carved to keep only the needed subset of features and exposed through a uniform API.

## The Asset Store

* The asset store is a core service/API that provides persitance for most data types needed by a simulation.
* The structure of the assets store is flat, built to be implemented on basic key/value stores 
* Load an asset store with core systems and components
* It can store:
  * Entities and their components
  * Prefab definitions
  * Assets like Bixels
  * Source text
  * Source code and metadata for systems and component definitions
  * Various binaries ?
* Storage and retrieval must be able to run in-memory, with simple persistance.
* Storing data should be non-blocking
* It should not be taught of as a general purpose "key/value" store at the risk of being polluted with odss and ends.

### Other Topics to cover

* Should the asset store be directly accessible via raw operations or require some definition step ?
* Writing to the store should be batched and processed between tics.
* The store should not be necessary "during" gameplay. 
* The scoping of content in the store should support a path as a slug. This will allow for scoping for users, rooms, groups, etc.
* Systems do not have access to the store during a tic.
* Should the storage of the complete simulation state be "automatically always stored", leaving the use of the store for special cases ?
* Asset stores can be implemented both as local storage in a broser, on disk or as a cloud service. While latency might differ, the asset store does not participate in the game loop and performance requirement are light. 
* A store can be pre-loaded by the app with a baseline of core assets for systems, components and prefabs.
* Systems, Component schemas and Prefabs are stored individually by their slug, but the persistance of a world is done as a block with the path and or slug for this world.
* Are stateless simulations flagged explicitly for optimisations since they can be singletons. (Ex.: Mouse pointer, game remote).
* A mechanism for content expiration is not needed at the moment, but the necessary dates should already be included in the data.

### Out of scope

* Automatic expiration of assets

### Exclusions

* Logging: Logging should be a core service and never rely.
* Caching: Caching should not be done using the asset store.
* Concept of Files: The idea of files simply does no exist as a core concept.
* 

