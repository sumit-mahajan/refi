const { ethers } = require("ethers")

const customPrint = (str) => {
    // console.log(str);
}

const toWei = (num) => {
    return ethers.utils.parseEther(num.toString());
}

const toEther = (num) => {
    return ethers.utils.formatEther(num.toString());
}

module.exports = {
    toWei,
    toEther,
    customPrint
}