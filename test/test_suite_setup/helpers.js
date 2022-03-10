const { BigNumber, ethers } = require("ethers")

const toWei = (num) => {
    return ethers.utils.parseEther(num.toString());
}

const toEther = (num) => {
    return ethers.utils.formatEther(num.toString());
}

const rayToNum = (num) => {
    const x = BigNumber.from(num.toString());
    console.log(x);
    const y = BigNumber.from("1000000000000000000000000000");

    return x.div(y);
}

module.exports = {
    toWei,
    toEther,
    rayToNum
}