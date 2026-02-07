# Sould the default world of Outside follow diegetic constraints

At this point in the development, I need to make a decision regarding UIs, HUDs, Menu Screens and the likes.

One creative goal or constraint I have been considering since the start is the application of diegetics to as many elements as possible in the default world presented by the project.

Diegetics means the representation of game elements and mechanics as being "part of the world" instead of being outside or over the actual game world.

I alwasy felt that these type of games felt more interesting and more immersive. It allows you to better suspend disbelief and forget that your just using software.

And the way I imagined implementing this constraint was to use the world simulator itself to generate spontaneous and momentary sub-worlds that feature the abstraction that the user must interact with.

The best example would be an inventory mechanic using pockets. 

**The classic non-diegetic version:**

> You open your inventory, the game pauses, and you see a menu appear with a special UI showing a scrolling list of items with labels. Each items has buttons and a menu of available actions.

**The diegetic version:**

> You look into you pockets, the game create a new simulation world and generated a level where the items in your pockets are layed out on the level "floor". You point to items the same wait you would point to a rock on the ground. The background would be themed to feel like the inside of you pocket, and floor tile could look like fabric.

This concept felt like a interesting design challenge and a way to invest a lot more time in the capabilities of the simulator instead of creating abstract UIs that would not profit from the combinatorial nature of the simulation engine.

## Examples

**Non-diegetic:**

- Tools: Floating Hotbar.
- Health: Metered bar floating in the top right
- Coordinates: A round minimap on the bottom left
- Location info : A title at the top of the screen
- Inventory: A popup with scrolling lists, button and menus.
- Inspection: A popup of stats and attributes when pointing to an item.

**Diegetic elements:**

- Tools: The current tool visible in the hand of the character
- Health: Bigger blood splat, struggling sounds, character utterings, character aesthetic changing.
- Coordinates: milestone on the ground you can reed.
- Location info : A sign-post, an in-game gps, or even putting on a screen corner the "memory" of the game element that featured the name of the place.
- Inventory: A backpack themed sub world.
- Inspection: When hovering a new item you never seen, all you can do is examine. When examining, you see a text showing what you think "in your mind", you can then select which part of the description you want to remember about this object. From there on, this object would show you your "memory" of what you had observed. (leading to game mechanics like objects that are not what they seem, or having memory loss, or having to re-examine an object)


**Pros:**

- A more immersive experience
- More investiment in the simulation engine
- Does not push a specific branding through the UI, leaving the branding to third-party games.
- The default welcome/home levels don't need to use all the game mechanics, because it serves as a lobby and a tutorial space.
- It encourages a calmer more grounded experience.
- It leave the external levels free to add those elements without having created expectations from the central area that would constrain third party and in-game creators.

**Cons:**

- Some concepts are very hard to convey without less than ideal interactions.
- Specific game mechanics near impossible to make diegetics.
- Longer learing curve on some concepts.


**Here are a bunch of good examples of diegetic game designs:**

- Death Stranding
- The witness
- Jame Bond 007
