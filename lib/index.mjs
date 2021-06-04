import {
  ObjectCreate,
  ObjectDefineProperties,
  SymbolToStringTag,
  RangeError,
  SyntaxError,
  TypeError,
  NumberIsFinite,
  BigInt,
  MathPI,
  MathRound,
  ArrayPrototypeForEach,
  ArrayPrototypePush,
  ReflectSetPrototypeOf,
  SafeGenerator,
  PrimitivesIsString,
  TypesToNumber,
  TypesToIntegerOrInfinity,
  TypesToBigInt
} from '@darkwolf/primordials'

const ALPHABET = '0123456789bcdefghjkmnpqrstuvwxyz'

const BITS_PER_CHAR = 5

const MAX_GEOHASH_PRECISION = 22

const MAX_GEOHASH_PRECISION_BITS = MAX_GEOHASH_PRECISION * BITS_PER_CHAR // 110
const MAX_GEOINT_BITS = 52
const MAX_GEOBIGINT_BITS = MAX_GEOHASH_PRECISION_BITS

const MAX_GEOINT = 2 ** MAX_GEOINT_BITS
const MAX_GEOBIGINT = 2n ** 110n

const GEOHASH_PRECISION = 10
const GEOINT_BITS = 52
const GEOBIGINT_BITS = 64

const MIN_LATITUDE = -90
const MAX_LATITUDE = 90
const MIN_LONGITUDE = -180
const MAX_LONGITUDE = 180

const getDirections = () => [
  'north',
  'northeast',
  'east',
  'southeast',
  'south',
  'southwest',
  'west',
  'northwest'
]
const directions = getDirections()

const directionLookup = {
  north: [1, 0],
  northeast: [1, 1],
  east: [0, 1],
  southeast: [-1, 1],
  south: [-1, 0],
  southwest: [-1, -1],
  west: [0, -1],
  northwest: [1, -1]
}
ReflectSetPrototypeOf(directionLookup, null)

const createAlphabetLookup = alphabet => {
  const lookup = ObjectCreate(null)
  for (let i = 0; i < 32; i++) {
    const char = alphabet[i]
    lookup[char] = i
  }
  return lookup
}
const alphabetLookup = createAlphabetLookup(ALPHABET)

const getBit = (number, position) => number / (2 ** position) & 1

const getBigIntBit = (bigInt, position) => bigInt / (2n ** BigInt(position)) & 1n

const wrapLatitude = latitude =>
  latitude < MIN_LATITUDE ? MIN_LATITUDE :
  latitude > MAX_LATITUDE ? MAX_LATITUDE : latitude

const wrapLongitude = longitude =>
  longitude < MIN_LONGITUDE ? MAX_LONGITUDE + longitude % MAX_LONGITUDE :
  longitude > MAX_LONGITUDE ? MIN_LONGITUDE + longitude % MAX_LONGITUDE : longitude

const toLatitude = value => {
  value = TypesToNumber(value)
  if (value < MIN_LATITUDE) {
    throw new RangeError('The latitude must be greater than or equal to -90')
  }
  if (value > MAX_LATITUDE) {
    throw new RangeError('The latitude must be less than or equal to 90')
  }
  return value
}

const toLongitude = value => {
  value = TypesToNumber(value)
  if (value < MIN_LONGITUDE) {
    throw new RangeError('The longitude must be greater than or equal to -180')
  }
  if (value > MAX_LONGITUDE) {
    throw new RangeError('The longitude must be less than or equal to 180')
  }
  return value
}

const toGeohashPrecision = value => {
  if (value === undefined) {
    return GEOHASH_PRECISION
  }
  value = TypesToIntegerOrInfinity(value)
  if (value <= 0) {
    throw new RangeError('The precision must be greater than zero')
  }
  if (value > MAX_GEOHASH_PRECISION) {
    throw new RangeError('The precision must be less than or equal to 22')
  }
  return value
}

const toGeointBits = value => {
  if (value === undefined) {
    return GEOINT_BITS
  }
  value = TypesToIntegerOrInfinity(value)
  if (value < 0) {
    throw new RangeError('The bits must be greater than or equal to zero')
  }
  if (value > MAX_GEOINT_BITS) {
    throw new RangeError('The bits must be less than or equal to 52')
  }
  return value
}

const toGeobigintBits = value => {
  if (value === undefined) {
    return GEOBIGINT_BITS
  }
  value = TypesToIntegerOrInfinity(value)
  if (value < 0) {
    throw new RangeError('The bits must be greater than or equal to zero')
  }
  if (value > MAX_GEOBIGINT_BITS) {
    throw new RangeError('The bits must be less than or equal to 110')
  }
  return value
}

const toGeoint = value => {
  value = TypesToIntegerOrInfinity(value)
  if (value < 0) {
    throw new RangeError('The geoint must be greater than or equal to zero')
  }
  if (value > MAX_GEOINT) {
    throw new RangeError('The geoint must be less than or equal to 2^52')
  }
  return value
}

const toGeobigint = value => {
  value = TypesToBigInt(value)
  if (value < 0n) {
    throw new RangeError('The geobigint must be greater than or equal to zero')
  }
  if (value > MAX_GEOBIGINT) {
    throw new RangeError('The geobigint must be less than or equal to 2n^110n')
  }
  return value
}

const validateGeohash = value => {
  if (!PrimitivesIsString(value)) {
    throw new TypeError('The geohash must be a string')
  }
  if (value.length > MAX_GEOHASH_PRECISION) {
    throw new RangeError('The length of the geohash must be less than or equal to 22')
  }
}

const validateDirection = value => {
  if (!PrimitivesIsString(value)) {
    throw new TypeError('The direction must be a string')
  }
  if (directionLookup[value] === undefined) {
    throw new TypeError('The direction must be "north", "northeast", "east", "southeast", "south", "southwest", "west" or "northwest"')
  }
}

const _encode = (latitude, longitude, precision) => {
  let minLat = MIN_LATITUDE
  let maxLat = MAX_LATITUDE
  let minLon = MIN_LONGITUDE
  let maxLon = MAX_LONGITUDE
  let isEven = true
  let bitCount = 0
  let carry = 0
  let result = ''
  while (result.length < precision) {
    if (isEven) {
      const avg = (minLon + maxLon) / 2
      if (longitude > avg) {
        carry = (carry << 1) + 1
        minLon = avg
      } else {
        carry <<= 1
        maxLon = avg
      }
    } else {
      const avg = (minLat + maxLat) / 2
      if (latitude > avg) {
        carry = (carry << 1) + 1
        minLat = avg
      } else {
        carry <<= 1
        maxLat = avg
      }
    }
    isEven = !isEven
    if (bitCount < 4) {
      bitCount++
    } else {
      result += ALPHABET[carry]
      bitCount = 0
      carry = 0
    }
  }
  return result
}
const encode = (latitude, longitude, precision) => {
  precision = toGeohashPrecision(precision)
  latitude = toLatitude(latitude)
  longitude = toLongitude(longitude)
  return _encode(latitude, longitude, precision)
}

const _encodeInt = (latitude, longitude, bits) => {
  let minLat = MIN_LATITUDE
  let maxLat = MAX_LATITUDE
  let minLon = MIN_LONGITUDE
  let maxLon = MAX_LONGITUDE
  let isEven = true
  let bitCount = 0
  let result = 0
  while (bitCount < bits) {
    result *= 2
    if (isEven) {
      const avg = (minLon + maxLon) / 2
      if (longitude > avg) {
        result += 1
        minLon = avg
      } else {
        maxLon = avg
      }
    } else {
      const avg = (minLat + maxLat) / 2
      if (latitude > avg) {
        result += 1
        minLat = avg
      } else {
        maxLat = avg
      }
    }
    isEven = !isEven
    bitCount++
  }
  return result
}
const encodeInt = (latitude, longitude, bits) => {
  bits = toGeointBits(bits)
  latitude = toLatitude(latitude)
  longitude = toLongitude(longitude)
  return _encodeInt(latitude, longitude, bits)
}

const _encodeBigInt = (latitude, longitude, bits) => {
  let minLat = MIN_LATITUDE
  let maxLat = MAX_LATITUDE
  let minLon = MIN_LONGITUDE
  let maxLon = MAX_LONGITUDE
  let isEven = true
  let bitCount = 0
  let result = 0n
  while (bitCount < bits) {
    result *= 2n
    if (isEven) {
      const avg = (minLon + maxLon) / 2
      if (longitude > avg) {
        result += 1n
        minLon = avg
      } else {
        maxLon = avg
      }
    } else {
      const avg = (minLat + maxLat) / 2
      if (latitude > avg) {
        result += 1n
        minLat = avg
      } else {
        maxLat = avg
      }
    }
    isEven = !isEven
    bitCount++
  }
  return result
}
const encodeBigInt = (latitude, longitude, bits) => {
  bits = toGeobigintBits(bits)
  latitude = toLatitude(latitude)
  longitude = toLongitude(longitude)
  return _encodeBigInt(latitude, longitude, bits)
}

const _decodeBoundingBox = geohash => {
  const {length} = geohash
  let minLat = MIN_LATITUDE
  let maxLat = MAX_LATITUDE
  let minLon = MIN_LONGITUDE
  let maxLon = MAX_LONGITUDE
  let isEven = true
  for (let i = 0; i < length; i++) {
    const char = geohash[i]
    const index = alphabetLookup[char]
    if (index === undefined) {
      throw new SyntaxError(`Invalid character "${char}" at index ${i} for Geohash encoding`)
    }
    for (let bitCount = 4; bitCount >= 0; bitCount--) {
      const bit = index >> bitCount & 1
      if (isEven) {
        const avg = (minLon + maxLon) / 2
        if (bit === 1) {
          minLon = avg
        } else {
          maxLon = avg
        }
      } else {
        const avg = (minLat + maxLat) / 2
        if (bit === 1) {
          minLat = avg
        } else {
          maxLat = avg
        }
      }
      isEven = !isEven
    }
  }
  return [minLat, minLon, maxLat, maxLon]
}
const decodeBoundingBox = geohash => {
  validateGeohash(geohash)
  return _decodeBoundingBox(geohash)
}

const _decodeBoundingBoxInt = (geoint, bits) => {
  const lastBit = bits - 1
  let minLat = MIN_LATITUDE
  let maxLat = MAX_LATITUDE
  let minLon = MIN_LONGITUDE
  let maxLon = MAX_LONGITUDE
  let isEven = true
  for (let i = 0; i < bits; i++) {
    const bit = getBit(geoint, lastBit - i)
    if (isEven) {
      const avg = (minLon + maxLon) / 2
      if (bit === 1) {
        minLon = avg
      } else {
        maxLon = avg
      }
    } else {
      const avg = (minLat + maxLat) / 2
      if (bit === 1) {
        minLat = avg
      } else {
        maxLat = avg
      }
    }
    isEven = !isEven
  }
  return [minLat, minLon, maxLat, maxLon]
}
const decodeBoundingBoxInt = (geoint, bits) => {
  bits = toGeointBits(bits)
  geoint = toGeoint(geoint)
  return _decodeBoundingBoxInt(geoint, bits)
}

const _decodeBoundingBoxBigInt = (geobigint, bits) => {
  const lastBit = bits - 1
  let minLat = MIN_LATITUDE
  let maxLat = MAX_LATITUDE
  let minLon = MIN_LONGITUDE
  let maxLon = MAX_LONGITUDE
  let isEven = true
  for (let i = 0; i < bits; i++) {
    const bit = getBigIntBit(geobigint, lastBit - i)
    if (isEven) {
      const avg = (minLon + maxLon) / 2
      if (bit === 1n) {
        minLon = avg
      } else {
        maxLon = avg
      }
    } else {
      const avg = (minLat + maxLat) / 2
      if (bit === 1n) {
        minLat = avg
      } else {
        maxLat = avg
      }
    }
    isEven = !isEven
  }
  return [minLat, minLon, maxLat, maxLon]
}
const decodeBoundingBoxBigInt = (geobigint, bits) => {
  bits = toGeobigintBits(bits)
  geobigint = toGeobigint(geobigint)
  return _decodeBoundingBoxBigInt(geobigint, bits)
}

const boundingBoxToLocation = (boundingBox, error) => {
  const [minLat, minLon, maxLat, maxLon] = boundingBox
  const latitude = (minLat + maxLat) / 2
  const longitude = (minLon + maxLon) / 2
  const location = {
    latitude,
    longitude
  }
  if (error) {
    const latError = maxLat - latitude
    const lonError = maxLon - longitude
    location.error = {
      latitude: latError,
      longitude: lonError
    }
  }
  return location
}

const decode = (geohash, error) => {
  const boundingBox = decodeBoundingBox(geohash)
  return boundingBoxToLocation(boundingBox, error)
}

const decodeInt = (geoint, bits, error) => {
  const boundingBox = decodeBoundingBoxInt(geoint, bits)
  return boundingBoxToLocation(boundingBox, error)
}

const decodeBigInt = (geobigint, bits, error) => {
  const boundingBox = decodeBoundingBoxBigInt(geobigint, bits)
  return boundingBoxToLocation(boundingBox, error)
}

const getNeighbor = (geohash, direction) => {
  validateDirection(direction)
  const [minLat, minLon, maxLat, maxLon] = decodeBoundingBox(geohash)
  const {length} = geohash
  const latitude = (minLat + maxLat) / 2
  const longitude = (minLon + maxLon) / 2
  const latError = maxLat - latitude
  const lonError = maxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const [latDir, lonDir] = directionLookup[direction]
  const neighborLat = wrapLatitude(latitude + latDir * perLat)
  const neighborLon = wrapLongitude(longitude + lonDir * perLon)
  return _encode(neighborLat, neighborLon, length)
}

const getNeighborInt = (geoint, direction, bits) => {
  bits = toGeointBits(bits)
  validateDirection(direction)
  geoint = toGeoint(geoint)
  const [minLat, minLon, maxLat, maxLon] = _decodeBoundingBoxInt(geoint, bits)
  const latitude = (minLat + maxLat) / 2
  const longitude = (minLon + maxLon) / 2
  const latError = maxLat - latitude
  const lonError = maxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const [latDir, lonDir] = directionLookup[direction]
  const neighborLat = wrapLatitude(latitude + latDir * perLat)
  const neighborLon = wrapLongitude(longitude + lonDir * perLon)
  return _encodeInt(neighborLat, neighborLon, bits)
}

const getNeighborBigInt = (geobigint, direction, bits) => {
  bits = toGeobigintBits(bits)
  validateDirection(direction)
  geobigint = toGeobigint(geobigint)
  const [minLat, minLon, maxLat, maxLon] = _decodeBoundingBoxBigInt(geobigint, bits)
  const latitude = (minLat + maxLat) / 2
  const longitude = (minLon + maxLon) / 2
  const latError = maxLat - latitude
  const lonError = maxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const [latDir, lonDir] = directionLookup[direction]
  const neighborLat = wrapLatitude(latitude + latDir * perLat)
  const neighborLon = wrapLongitude(longitude + lonDir * perLon)
  return _encodeBigInt(neighborLat, neighborLon, bits)
}

const getNeighbors = geohash => {
  const [minLat, minLon, maxLat, maxLon] = decodeBoundingBox(geohash)
  const {length} = geohash
  const latitude = (minLat + maxLat) / 2
  const longitude = (minLon + maxLon) / 2
  const latError = maxLat - latitude
  const lonError = maxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const neighbors = {}
  ArrayPrototypeForEach(directions, direction => {
    const [latDir, lonDir] = directionLookup[direction]
    const neighborLat = wrapLatitude(latitude + latDir * perLat)
    const neighborLon = wrapLongitude(longitude + lonDir * perLon)
    neighbors[direction] = _encode(neighborLat, neighborLon, length)
  })
  return neighbors
}

const getNeighborsInt = (geoint, bits) => {
  bits = toGeointBits(bits)
  geoint = toGeoint(geoint)
  const [minLat, minLon, maxLat, maxLon] = _decodeBoundingBoxInt(geoint, bits)
  const latitude = (minLat + maxLat) / 2
  const longitude = (minLon + maxLon) / 2
  const latError = maxLat - latitude
  const lonError = maxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const neighbors = {}
  ArrayPrototypeForEach(directions, direction => {
    const [latDir, lonDir] = directionLookup[direction]
    const neighborLat = wrapLatitude(latitude + latDir * perLat)
    const neighborLon = wrapLongitude(longitude + lonDir * perLon)
    neighbors[direction] = _encodeInt(neighborLat, neighborLon, bits)
  })
  return neighbors
}

const getNeighborsBigInt = (geobigint, bits) => {
  bits = toGeobigintBits(bits)
  geobigint = toGeobigint(geobigint)
  const [minLat, minLon, maxLat, maxLon] = _decodeBoundingBoxBigInt(geobigint, bits)
  const latitude = (minLat + maxLat) / 2
  const longitude = (minLon + maxLon) / 2
  const latError = maxLat - latitude
  const lonError = maxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const neighbors = {}
  ArrayPrototypeForEach(directions, direction => {
    const [latDir, lonDir] = directionLookup[direction]
    const neighborLat = wrapLatitude(latitude + latDir * perLat)
    const neighborLon = wrapLongitude(longitude + lonDir * perLon)
    neighbors[direction] = _encodeBigInt(neighborLat, neighborLon, bits)
  })
  return neighbors
}

const getBoundingBoxes = (minLat, minLon, maxLat, maxLon, precision) => {
  precision = toGeohashPrecision(precision)
  minLat = toLatitude(minLat)
  minLon = toLongitude(minLon)
  maxLat = toLatitude(maxLat)
  maxLon = toLongitude(maxLon)
  const southwestGeohash = _encode(minLat, minLon, precision)
  const northeastGeohash = _encode(maxLat, maxLon, precision)
  const [southwestMinLat, southwestMinLon, southwestMaxLat, southwestMaxLon] = _decodeBoundingBox(southwestGeohash)
  const [northeastMinLat, northeastMinLon] = _decodeBoundingBox(northeastGeohash)
  const latitude = (southwestMinLat + southwestMaxLat) / 2
  const longitude = (southwestMinLon + southwestMaxLon) / 2
  const latError = southwestMaxLat - latitude
  const lonError = southwestMaxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const latLength = MathRound((northeastMinLat - southwestMinLat) / perLat)
  const lonLength = MathRound((northeastMinLon - southwestMinLon) / perLon)
  const result = []
  if (NumberIsFinite(latLength) && NumberIsFinite(lonLength)) {
    for (let latDir = 0; latDir <= latLength; latDir++) {
      for (let lonDir = 0; lonDir <= lonLength; lonDir++) {
        const neighborLat = wrapLatitude(latitude + latDir * perLat)
        const neighborLon = wrapLongitude(longitude + lonDir * perLon)
        ArrayPrototypePush(result, _encode(neighborLat, neighborLon, precision))
      }
    }
  }
  return result
}

const getBoundingBoxesInt = (minLat, minLon, maxLat, maxLon, bits) => {
  bits = toGeointBits(bits)
  minLat = toLatitude(minLat)
  minLon = toLongitude(minLon)
  maxLat = toLatitude(maxLat)
  maxLon = toLongitude(maxLon)
  const southwestGeoint = _encodeInt(minLat, minLon, bits)
  const northeastGeoint = _encodeInt(maxLat, maxLon, bits)
  const [southwestMinLat, southwestMinLon, southwestMaxLat, southwestMaxLon] = _decodeBoundingBoxInt(southwestGeoint, bits)
  const [northeastMinLat, northeastMinLon] = _decodeBoundingBoxInt(northeastGeoint, bits)
  const latitude = (southwestMinLat + southwestMaxLat) / 2
  const longitude = (southwestMinLon + southwestMaxLon) / 2
  const latError = southwestMaxLat - latitude
  const lonError = southwestMaxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const latLength = MathRound((northeastMinLat - southwestMinLat) / perLat)
  const lonLength = MathRound((northeastMinLon - southwestMinLon) / perLon)
  const result = []
  if (NumberIsFinite(latLength) && NumberIsFinite(lonLength)) {
    for (let latDir = 0; latDir <= latLength; latDir++) {
      for (let lonDir = 0; lonDir <= lonLength; lonDir++) {
        const neighborLat = wrapLatitude(latitude + latDir * perLat)
        const neighborLon = wrapLongitude(longitude + lonDir * perLon)
        ArrayPrototypePush(result, _encodeInt(neighborLat, neighborLon, bits))
      }
    }
  }
  return result
}

const getBoundingBoxesBigInt = (minLat, minLon, maxLat, maxLon, bits) => {
  bits = toGeobigintBits(bits)
  minLat = toLatitude(minLat)
  minLon = toLongitude(minLon)
  maxLat = toLatitude(maxLat)
  maxLon = toLongitude(maxLon)
  const southwestGeobigint = _encodeBigInt(minLat, minLon, bits)
  const northeastGeobigint = _encodeBigInt(maxLat, maxLon, bits)
  const [southwestMinLat, southwestMinLon, southwestMaxLat, southwestMaxLon] = _decodeBoundingBoxBigInt(southwestGeobigint, bits)
  const [northeastMinLat, northeastMinLon] = _decodeBoundingBoxBigInt(northeastGeobigint, bits)
  const latitude = (southwestMinLat + southwestMaxLat) / 2
  const longitude = (southwestMinLon + southwestMaxLon) / 2
  const latError = southwestMaxLat - latitude
  const lonError = southwestMaxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const latLength = MathRound((northeastMinLat - southwestMinLat) / perLat)
  const lonLength = MathRound((northeastMinLon - southwestMinLon) / perLon)
  const result = []
  if (NumberIsFinite(latLength) && NumberIsFinite(lonLength)) {
    for (let latDir = 0; latDir <= latLength; latDir++) {
      for (let lonDir = 0; lonDir <= lonLength; lonDir++) {
        const neighborLat = wrapLatitude(latitude + latDir * perLat)
        const neighborLon = wrapLongitude(longitude + lonDir * perLon)
        ArrayPrototypePush(result, _encodeBigInt(neighborLat, neighborLon, bits))
      }
    }
  }
  return result
}

function* boundingBoxesGenerator(minLat, minLon, maxLat, maxLon, precision) {
  precision = toGeohashPrecision(precision)
  minLat = toLatitude(minLat)
  minLon = toLongitude(minLon)
  maxLat = toLatitude(maxLat)
  maxLon = toLongitude(maxLon)
  const southwestGeohash = _encode(minLat, minLon, precision)
  const northeastGeohash = _encode(maxLat, maxLon, precision)
  const [southwestMinLat, southwestMinLon, southwestMaxLat, southwestMaxLon] = _decodeBoundingBox(southwestGeohash)
  const [northeastMinLat, northeastMinLon] = _decodeBoundingBox(northeastGeohash)
  const latitude = (southwestMinLat + southwestMaxLat) / 2
  const longitude = (southwestMinLon + southwestMaxLon) / 2
  const latError = southwestMaxLat - latitude
  const lonError = southwestMaxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const latLength = MathRound((northeastMinLat - southwestMinLat) / perLat)
  const lonLength = MathRound((northeastMinLon - southwestMinLon) / perLon)
  if (NumberIsFinite(latLength) && NumberIsFinite(lonLength)) {
    for (let latDir = 0; latDir <= latLength; latDir++) {
      for (let lonDir = 0; lonDir <= lonLength; lonDir++) {
        const neighborLat = wrapLatitude(latitude + latDir * perLat)
        const neighborLon = wrapLongitude(longitude + lonDir * perLon)
        yield _encode(neighborLat, neighborLon, precision)
      }
    }
  }
}
const boundingBoxesSafeGenerator = (minLat, minLon, maxLat, maxLon, precision) =>
  new SafeGenerator(boundingBoxesGenerator(minLat, minLon, maxLat, maxLon, precision))

function* boundingBoxesIntGenerator(minLat, minLon, maxLat, maxLon, bits) {
  bits = toGeointBits(bits)
  minLat = toLatitude(minLat)
  minLon = toLongitude(minLon)
  maxLat = toLatitude(maxLat)
  maxLon = toLongitude(maxLon)
  const southwestGeoint = _encodeInt(minLat, minLon, bits)
  const northeastGeoint = _encodeInt(maxLat, maxLon, bits)
  const [southwestMinLat, southwestMinLon, southwestMaxLat, southwestMaxLon] = _decodeBoundingBoxInt(southwestGeoint, bits)
  const [northeastMinLat, northeastMinLon] = _decodeBoundingBoxInt(northeastGeoint, bits)
  const latitude = (southwestMinLat + southwestMaxLat) / 2
  const longitude = (southwestMinLon + southwestMaxLon) / 2
  const latError = southwestMaxLat - latitude
  const lonError = southwestMaxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const latLength = MathRound((northeastMinLat - southwestMinLat) / perLat)
  const lonLength = MathRound((northeastMinLon - southwestMinLon) / perLon)
  if (NumberIsFinite(latLength) && NumberIsFinite(lonLength)) {
    for (let latDir = 0; latDir <= latLength; latDir++) {
      for (let lonDir = 0; lonDir <= lonLength; lonDir++) {
        const neighborLat = wrapLatitude(latitude + latDir * perLat)
        const neighborLon = wrapLongitude(longitude + lonDir * perLon)
        yield _encodeInt(neighborLat, neighborLon, bits)
      }
    }
  }
}
const boundingBoxesIntSafeGenerator = (minLat, minLon, maxLat, maxLon, bits) =>
  new SafeGenerator(boundingBoxesIntGenerator(minLat, minLon, maxLat, maxLon, bits))

function* boundingBoxesBigIntGenerator(minLat, minLon, maxLat, maxLon, bits) {
  bits = toGeobigintBits(bits)
  minLat = toLatitude(minLat)
  minLon = toLongitude(minLon)
  maxLat = toLatitude(maxLat)
  maxLon = toLongitude(maxLon)
  const southwestGeobigint = _encodeBigInt(minLat, minLon, bits)
  const northeastGeobigint = _encodeBigInt(maxLat, maxLon, bits)
  const [southwestMinLat, southwestMinLon, southwestMaxLat, southwestMaxLon] = _decodeBoundingBoxBigInt(southwestGeobigint, bits)
  const [northeastMinLat, northeastMinLon] = _decodeBoundingBoxBigInt(northeastGeobigint, bits)
  const latitude = (southwestMinLat + southwestMaxLat) / 2
  const longitude = (southwestMinLon + southwestMaxLon) / 2
  const latError = southwestMaxLat - latitude
  const lonError = southwestMaxLon - longitude
  const perLat = latError * 2
  const perLon = lonError * 2
  const latLength = MathRound((northeastMinLat - southwestMinLat) / perLat)
  const lonLength = MathRound((northeastMinLon - southwestMinLon) / perLon)
  if (NumberIsFinite(latLength) && NumberIsFinite(lonLength)) {
    for (let latDir = 0; latDir <= latLength; latDir++) {
      for (let lonDir = 0; lonDir <= lonLength; lonDir++) {
        const neighborLat = wrapLatitude(latitude + latDir * perLat)
        const neighborLon = wrapLongitude(longitude + lonDir * perLon)
        yield _encodeBigInt(neighborLat, neighborLon, bits)
      }
    }
  }
}
const boundingBoxesBigIntSafeGenerator = (minLat, minLon, maxLat, maxLon, bits) =>
  new SafeGenerator(boundingBoxesBigIntGenerator(minLat, minLon, maxLat, maxLon, bits))

const Geohash = {}
ObjectDefineProperties(Geohash, {
  ALPHABET: {
    value: ALPHABET
  },
  BITS_PER_CHAR: {
    value: BITS_PER_CHAR
  },
  MAX_GEOHASH_PRECISION: {
    value: MAX_GEOHASH_PRECISION
  },
  MAX_GEOHASH_PRECISION_BITS: {
    value: MAX_GEOHASH_PRECISION_BITS
  },
  MAX_GEOINT_BITS: {
    value: MAX_GEOINT_BITS
  },
  MAX_GEOBIGINT_BITS: {
    value: MAX_GEOBIGINT_BITS
  },
  MAX_GEOINT: {
    value: MAX_GEOINT
  },
  MAX_GEOBIGINT: {
    value: MAX_GEOBIGINT
  },
  GEOHASH_PRECISION: {
    value: GEOHASH_PRECISION
  },
  GEOINT_BITS: {
    value: GEOINT_BITS
  },
  GEOBIGINT_BITS: {
    value: GEOBIGINT_BITS
  },
  MIN_LATITUDE: {
    value: MIN_LATITUDE
  },
  MAX_LATITUDE: {
    value: MAX_LATITUDE
  },
  MIN_LONGITUDE: {
    value: MIN_LONGITUDE
  },
  MAX_LONGITUDE: {
    value: MAX_LONGITUDE
  },
  getDirections: {
    value: getDirections
  },
  encode: {
    value: encode
  },
  encodeInt: {
    value: encodeInt
  },
  encodeBigInt: {
    value: encodeBigInt
  },
  decodeBoundingBox: {
    value: decodeBoundingBox
  },
  decodeBoundingBoxInt: {
    value: decodeBoundingBoxInt
  },
  decodeBoundingBoxBigInt: {
    value: decodeBoundingBoxBigInt
  },
  decode: {
    value: decode
  },
  decodeInt: {
    value: decodeInt
  },
  decodeBigInt: {
    value: decodeBigInt
  },
  getNeighbor: {
    value: getNeighbor
  },
  getNeighborInt: {
    value: getNeighborInt
  },
  getNeighborBigInt: {
    value: getNeighborBigInt
  },
  getNeighbors: {
    value: getNeighbors
  },
  getNeighborsInt: {
    value: getNeighborsInt
  },
  getNeighborsBigInt: {
    value: getNeighborsBigInt
  },
  getBoundingBoxes: {
    value: getBoundingBoxes
  },
  getBoundingBoxesInt: {
    value: getBoundingBoxesInt
  },
  getBoundingBoxesBigInt: {
    value: getBoundingBoxesBigInt
  },
  boundingBoxesGenerator: {
    value: boundingBoxesGenerator
  },
  boundingBoxesSafeGenerator: {
    value: boundingBoxesSafeGenerator
  },
  boundingBoxesIntGenerator: {
    value: boundingBoxesIntGenerator
  },
  boundingBoxesIntSafeGenerator: {
    value: boundingBoxesIntSafeGenerator
  },
  boundingBoxesBigIntGenerator: {
    value: boundingBoxesBigIntGenerator
  },
  boundingBoxesBigIntSafeGenerator: {
    value: boundingBoxesBigIntSafeGenerator
  },
  [SymbolToStringTag]: {
    value: 'Geohash'
  }
})

export {
  ALPHABET,
  BITS_PER_CHAR,
  MAX_GEOHASH_PRECISION,
  MAX_GEOHASH_PRECISION_BITS,
  MAX_GEOINT_BITS,
  MAX_GEOBIGINT_BITS,
  MAX_GEOINT,
  MAX_GEOBIGINT,
  GEOHASH_PRECISION,
  GEOINT_BITS,
  GEOBIGINT_BITS,
  MIN_LATITUDE,
  MAX_LATITUDE,
  MIN_LONGITUDE,
  MAX_LONGITUDE,
  getDirections,
  encode,
  encodeInt,
  encodeBigInt,
  decodeBoundingBox,
  decodeBoundingBoxInt,
  decodeBoundingBoxBigInt,
  decode,
  decodeInt,
  decodeBigInt,
  getNeighbor,
  getNeighborInt,
  getNeighborBigInt,
  getNeighbors,
  getNeighborsInt,
  getNeighborsBigInt,
  getBoundingBoxes,
  getBoundingBoxesInt,
  getBoundingBoxesBigInt,
  boundingBoxesGenerator,
  boundingBoxesSafeGenerator,
  boundingBoxesIntGenerator,
  boundingBoxesIntSafeGenerator,
  boundingBoxesBigIntGenerator,
  boundingBoxesBigIntSafeGenerator
}
export default Geohash
