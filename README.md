# Geohash
## Install
`npm i --save @darkwolf/geohash`
## Usage
```javascript
// ECMAScript
import Geohash from '@darkwolf/geohash'
// CommonJS
const Geohash = require('@darkwolf/geohash')

const location = {
  latitude: 64.0123456789,
  longitude: 64.0123456789
}

// Geohash Encoding
const encoded = Geohash.encode(location.latitude, location.longitude) // => 'v7ms0th6gy'
const decoded = Geohash.decode(encoded) // =>
// {
//   latitude: 64.01234775781631,
//   longitude: 64.01235044002533
// }
const decodedBoundingBox = Geohash.decodeBoundingBox(encoded) // =>
// [
//   64.0123450756073, // minLat
//   64.0123450756073, // minLon
//   64.01235044002533, // maxLat
//   64.01235580444336 // maxLon
// ]

const encodedWithMaxPrecision = Geohash.encode(location.latitude, location.longitude, 22) // => 'v7ms0th6gy07w7hthsg7my'
const decodedWithMaxPrecision = Geohash.decode(encodedWithMaxPrecision) // =>
// {
//   latitude: 64.0123456789,
//   longitude: 64.0123456789
// }
const decodedBoundingBoxWithMaxPrecision = Geohash.decodeBoundingBox(encodedWithMaxPrecision) // =>
// [
//   64.01234567889999,
//   64.01234567889999,
//   64.0123456789,
//   64.0123456789
// ]

const neighbor = Geohash.getNeighbor(encoded, 'north') // => 'v7ms0th6gz'
const neighbors = Geohash.getNeighbors(encoded) // =>
// {
//   north: 'v7ms0th6gz',
//   northeast: 'v7ms0th6up',
//   east: 'v7ms0th6un',
//   southeast: 'v7ms0th6uj',
//   south: 'v7ms0th6gv',
//   southwest: 'v7ms0th6gt',
//   west: 'v7ms0th6gw',
//   northwest: 'v7ms0th6gx'
// }

// Geoint Encoding
const encodedInt = Geohash.encodeInt(location.latitude, location.longitude) // => 3833413037484024
const decodedInt = Geohash.decodeInt(encodedInt) // =>
// {
//   latitude: 64.01234641671181,
//   longitude: 64.01234775781631
// }
const decodedBoundingBoxInt = Geohash.decodeBoundingBoxInt(encodedInt) // =>
// [
//   64.0123450756073,
//   64.0123450756073,
//   64.01234775781631,
//   64.01235044002533
// ]

const neighborInt = Geohash.getNeighborInt(encodedInt, 'north') // => 3833413037484025
const neighborsInt = Geohash.getNeighborsInt(encodedInt) // =>
// {
//   north: 3833413037484025,
//   northeast: 3833413037484027,
//   east: 3833413037484026,
//   southeast: 3833413037484015,
//   south: 3833413037484013,
//   southwest: 3833413037484007,
//   west: 3833413037484018,
//   northwest: 3833413037484019
// }

// Geobigint Encoding
const encodedBigInt = Geohash.encodeBigInt(location.latitude, location.longitude) // => 15701659801534562430n
const decodedBigInt = Geohash.decodeBigInt(encodedBigInt) // =>
// {
//   latitude: 64.01234568329528,
//   longitude: 64.01234570425004
// }
const decodedBoundingBoxBigInt = Geohash.decodeBoundingBoxBigInt(encodedBigInt) // =>
// [
//   64.01234566234052,
//   64.01234566234052,
//   64.01234570425004,
//   64.01234574615955
// ]

const encodedBigIntWithMaxBits = Geohash.encodeBigInt(location.latitude, location.longitude, 110) // => 1104906081738896117776798162853502n
const decodedBigIntWithMaxBits = Geohash.decodeBigInt(encodedBigIntWithMaxBits, 110) // =>
// {
//   latitude: 64.0123456789,
//   longitude: 64.0123456789
// }
const decodedBoundingBoxBigIntWithMaxBits = Geohash.decodeBoundingBoxBigInt(encodedBigIntWithMaxBits, 110) // =>
// [
//   64.01234567889999,
//   64.01234567889999,
//   64.0123456789,
//   64.0123456789
// ]

const neighborBigInt = Geohash.getNeighborBigInt(encodedBigInt, 'north') // => 15701659801534562431n
const neighborsBigInt = Geohash.getNeighborsBigInt(encodedBigInt) // =>
// {
//   north: 15701659801534562431n,
//   northeast: 15701659801534562517n,
//   east: 15701659801534562516n,
//   southeast: 15701659801534562513n,
//   south: 15701659801534562427n,
//   southwest: 15701659801534562425n,
//   west: 15701659801534562428n,
//   northwest: 15701659801534562429n
// }
```
## [API Documentation](https://github.com/Darkwolf/node-geohash/blob/master/docs/API.md)
## Contact Me
#### GitHub: [@PavelWolfDark](https://github.com/PavelWolfDark)
#### Telegram: [@PavelWolfDark](https://t.me/PavelWolfDark)
#### Email: [PavelWolfDark@gmail.com](mailto:PavelWolfDark@gmail.com)
