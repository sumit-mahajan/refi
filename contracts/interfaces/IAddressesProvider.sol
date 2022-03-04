//SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

/**
 * @title AddressesProvider contract
 * @dev Main registry of addresses part of or connected to the protocol
 * @author Aave
 **/
interface IAddressesProvider {
    /**
     * @dev Returns the address of the deployed InterestRateStrategy contract
     * @return The address of the InterestRateStrategy contract
     **/
    function getInterestRateStrategy() external view returns (address);

    /**
     * @dev Returns the address of the deployed LendingPool contract
     * @return The address of the LendingPool contract
     **/
    function getLendingPool() external view returns (address);

    /**
     * @dev Returns the address of the deployed WETHGateway contract
     * @return The address of the WETHGateway contract
     **/
    function getWETHGateway() external view returns (address);

    /**
     * @dev Returns the address of the deployed PriceOracle contract
     * @return The address of the PriceOracle contract
     **/
    function getPriceOracle() external view returns (address);
}
