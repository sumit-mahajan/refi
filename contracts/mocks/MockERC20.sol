// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        address deployer
    ) ERC20(name, symbol) {
        mint(deployer, 1000 ether);
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
