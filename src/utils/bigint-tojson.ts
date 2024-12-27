declare global {
  interface BigInt {
    toJSON: () => number | string;
  }
}

export class BigIntToJSON {
  constructor() {
    BigInt.prototype.toJSON = function () {
      const int = Number.parseInt(this.toString());
      return int ?? this.toString();
    };
  }
}