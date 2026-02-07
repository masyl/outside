# Demo Level

This is the demo level for the Outside game. Commands are organized by section.

## Terrain

```cmd
create terrain grass grassBase -30 -30 60 60
create terrain dirt dirt2 0 0 2 10
create terrain water water1 8 1 10 9
create terrain grass grass1 2 0 6 10
create terrain grass grass2 8 0 10 1
create terrain grass grass3 0 8 5 2
create terrain sand sand1 2 6 3 2
create terrain sand sand2 5 4 6 5
create terrain hole hole1 7 5 2 2
```

## Bots

```cmd
create bot leader
place leader 2 2

create bot follow1
place follow1 6 2

create bot follow2
place follow2 2 6

create bot follow3
place follow3 6 6

create bot follow4
place follow4 10 6

# Configure urges (leader wanders; others follow in a chain)
wander leader
follow follow1 leader 0.5
follow follow2 follow1 0.5
follow follow3 follow2 0.5
follow follow4 follow3 0.5
```
