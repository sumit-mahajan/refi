//SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IAddressesProvider} from "./interfaces/IAddressesProvider.sol";

/**
 * @title AddressesProvider contract
 * @dev Main registry of addresses part of or connected to the protocol
 * @author Aave
 **/
contract AddressesProvider is Ownable, IAddressesProvider {
    mapping(bytes32 => address) private _addresses;

    bytes32 private constant INTEREST_RATE_STRATEGY = 'INTEREST_RATE_STRATEGY';
    bytes32 private constant LENDING_POOL = 'LENDING_POOL';
    bytes32 private constant WETH_GATEWAY = 'WETH_GATEWAY';
    bytes32 private constant PRICE_ORACLE = 'PRICE_ORACLE';

    constructor() {

    }

    /**
    * @dev Sets an address for an id replacing the address saved in the addresses map
    * IMPORTANT Use this function carefully, as it will do a hard replacement
    * @param id The id
    * @param newAddress The address to set
    */
    function setAddress(bytes32 id, address newAddress) internal onlyOwner {
        _addresses[id] = newAddress;
        // emit AddressSet(id, newAddress, false);
    }

    /**
    * @dev Returns an address by id
    * @return The address
    */
    function getAddress(bytes32 id) public view returns (address) {
        return _addresses[id];
    }

    /**
     * @dev Returns the address of the deployed InterestRateStrategy contract
     * @return The address of the InterestRateStrategy contract
     **/
    function getInterestRateStrategy() external view override returns (address) {
        return getAddress(INTEREST_RATE_STRATEGY);
    }

    function setInterestRateStrategy(address interestRateStrategy) external onlyOwner {
        setAddress(INTEREST_RATE_STRATEGY, interestRateStrategy);
    }

    /**
     * @dev Returns the address of the deployed LendingPool contract
     * @return The address of the LendingPool contract
     **/
    function getLendingPool() external view override returns (address) {
        return getAddress(LENDING_POOL);
    }

    /**
   * @dev Updates the implementation of the LendingPool, or creates the proxy
   * setting the new `pool` implementation on the first time calling it
   * @param pool The new LendingPool implementation
   **/
    function setLendingPool(address pool) external onlyOwner {
        setAddress(LENDING_POOL, pool);
        // emit LendingPoolUpdated(pool);
    }

    /**
     * @dev Returns the address of the deployed WETHGateway contract
     * @return The address of the WETHGateway contract
     **/
    function getWETHGateway() external view override returns (address) {
        return getAddress(WETH_GATEWAY);
    }

    function setWETHGateway(address weth_gateway) external onlyOwner {
        setAddress(WETH_GATEWAY, weth_gateway);
    }

    /**
     * @dev Returns the address of the deployed PriceOracle contract
     * @return The address of the PriceOracle contract
     **/
    function getPriceOracle() external view override returns (address) {
        return getAddress(PRICE_ORACLE);
    }
    function setPriceOracle(address priceOracle) external onlyOwner {
        setAddress(PRICE_ORACLE, priceOracle);
        // emit PriceOracleUpdated(priceOracle);
    }
}
