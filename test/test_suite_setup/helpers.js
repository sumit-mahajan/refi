const { BigNumber } = require("ethers")

const rayToNum = (num) => {
    const x = BigNumber.from(num.toString());
    console.log(x);
    const y = BigNumber.from("1000000000000000000000000000");

    return x.div(y);
}

module.exports = {
    rayToNum
}