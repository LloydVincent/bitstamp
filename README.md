## BitStamp

Javascript numbers have 64 bits, that's a lot to work with.<br>
BitStamp is a Typescript class which uses the bits in a single number to represent a small object.

### Example usage

Below illustrates a BitStamp used to represent a character instance in a game.

```javascript
const CHARACTER_DATA_BITMAP = [
  // first 4 bytes
  { key: "masterId",     bitmask: 0b11111111111100000000000000000000 }, // max 4095
  { key: "level",        bitmask: 0b00000000000011111110000000000000 }, // 127
  { key: "exp",          bitmask: 0b00000000000000000001111111111111 }, // 8191
  // second 4 bytes
  { key: "type",         bitmask: 0b11111100000000000000000000000000 }, // 63
  { key: "isLocked",     bitmask: 0b00000010000000000000000000000000 }, // boolean
  { key: "equippedItem", bitmask: 0b00000001111111100000000000000000 }, // 255
  { key: "iv1",          bitmask: 0b00000000000000011110000000000000 }, // 15
  { key: "iv2",          bitmask: 0b00000000000000000001111000000000 },  // 15
  { key: "unused",       bitmask: 0b00000000000000000000000111111111 }  
]

let randomFloat = Math.random() * Number.MAX_VALUE // 1.0436053102163352e+307

let myBitStamp = new BitStamp(randomFloat, CHARACTER_DATA_BITMAP)

console.log(myBitStamp.stamp) // 1.0436053102163352e+307 (calculated, not saved)
console.log(myBitStamp.data)  // { masterId: 744, level: 120, ... }

myBitStamp.data.masterId = 2000

console.log(myBitStamp.stamp) // 2.5234613087001223e+47
console.log(myBitStamp.data)  // { masterId: 2000, level: 120, ... }
```

### Why?

* Bitwise ops are performant and cool
* Reduce network data transfer
* Reduce database complexity
* Easily snapshot a liquid data state (helpful to keep an accurate and isolated record of a battle/game, simply by pushing floats onto an array)

### Assumptions/Gotchas

* bitmaps should define segments in logical left-to-right order
* bits within segments must be contiguous
* the last bit of the fourth byte is part of a segment (it signals the next uint32)
* a segment can not span from the first to the second byte
* 1-length segments are cast to booleans
* bits not in any segment are 0 when BitStamp.stamp is called
