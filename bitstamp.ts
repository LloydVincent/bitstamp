export interface BitStampSegment {
  key: string,
  bitmask: number // eg: 0b00000000111110000000000000000000
}

export class BitStamp {
  public data: any = {}
  private __segments: BitStampSegment[]

  constructor(float: number, segments: BitStampSegment[]) {
    this.setFloat(float, segments)
  }

  // ASSUMPTIONS
  // - segments are in left-to-right order
  // - bits within segments are contiguous
  // - the last bit of the first byte is part of a segment
  public setFloat(float: number, segments: BitStampSegment[]) {
    this.data = {};
    var decode: Uint32Array = BitStamp.DoubleToIEEE(float)
    var currentByte = decode[0]
    for(let segment of segments) {
      var trailingZeroes = BitStamp.countTrailingZeroBits(segment.bitmask)

      this.data[segment.key] = (currentByte & segment.bitmask) >>> trailingZeroes;

      // interpret 1-bit length as a boolean
      if(trailingZeroes + Math.clz32(segment.bitmask) === 31)
        this.data[segment.key] = !!this.data[segment.key] // boolean cast

      // advance to second byte
      if(trailingZeroes === 0)
        currentByte = decode[1]
    }
    this.__segments = segments
  }

  public get stamp(): number {
    var bytes = [0, 0]
    var currentByte = 0
    for(let segment of this.__segments) {
      var trailingZeroes = BitStamp.countTrailingZeroBits(segment.bitmask)
      bytes[currentByte] |= this.data[segment.key] << trailingZeroes

      // advance to next byte
      if(trailingZeroes === 0)
        currentByte++
    }
    return BitStamp.IEEEToDouble(bytes)
  }

  public toString(): string {
    return `BitStamp (${this.stamp}): ${JSON.stringify(this.data)}`
  }

  public isEqual(otherStamp: BitStamp) {
    var keyDiffCheck = (key => { return this.data[key] === otherStamp[key] })
    return Object.keys(this.data).findIndex(keyDiffCheck) === -1 &&
      Object.keys(otherStamp.data).findIndex(keyDiffCheck) === -1
  }

  // Float64 -> Uint32Array[2]
  //
  // Javascript numbers are 64 bit floats but are converted to
  // Uint32 when used in bit operations, so to prevent loss of data
  // we must use a buffer to force the float to behave as a pair of Uint32s
  private static DoubleToIEEE(dbl: number): Uint32Array {
    var buf = new ArrayBuffer(8)
    var float = new Float64Array(buf)
    var uint = new Uint32Array(buf)
    float[0] = dbl
    return uint
  }

  // Uint32Array[2] > Float64
  private static IEEEToDouble(ieee: number[]): number {
    var buf = new ArrayBuffer(8)
    var float = new Float64Array(buf)
    var uint = new Uint32Array(buf)
    uint[0] = ieee[0]
    uint[1] = ieee[1]
    return float[0]
  }

  private static countTrailingZeroBits(uint: number): number {
    var mask = 1
    for(var i = 0; i < 32; i++, mask <<= 1) {
      if((uint & mask) !== 0) return i
    }
    return 32
  }
}
