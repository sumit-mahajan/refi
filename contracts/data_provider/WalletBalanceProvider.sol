// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

import {IAddressesProvider} from "../interfaces/IAddressesProvider.sol";
import {ILendingPool} from "../interfaces/ILendingPool.sol";
import {ReserveConfiguration} from "../libraries/configuration/ReserveConfiguration.sol";
import {DataTypes} from "../libraries/utils/DataTypes.sol";

/**
 * @title WalletBalanceProvider contract
 * @author Aave, influenced by https://github.com/wbobeirne/eth-balance-checker/blob/master/contracts/BalanceChecker.sol
 * @notice Implements a logic of getting multiple tokens balance for one user address
 * @dev NOTE: THIS CONTRACT IS NOT USED WITHIN THE AAVE PROTOCOL. It's an accessory contract used to reduce the number of calls
 * towards the blockchain from the Aave backend.
 **/
contract WalletBalanceProvider {
    using Address for address payable;
    using Address for address;
    using SafeERC20 for IERC20;
    using ReserveConfiguration for DataTypes.ReserveConfigurationMap;

    address constant MOCK_ETH_ADDRESS =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    mapping(bytes32 => AggregatorV3Interface) private assetsSources;

    constructor(bytes32[] memory assets, address[] memory sources) {
        require(assets.length == sources.length, "INCONSISTENT_PARAMS_LENGTH");
        for (uint256 i = 0; i < assets.length; i++) {
            assetsSources[assets[i]] = AggregatorV3Interface(sources[i]);
        }
    }

    /**
    @dev Fallback function, don't accept any ETH
    **/
    receive() external payable {
        //only contracts can send ETH to the core
        require(msg.sender.isContract(), "22");
    }

    /**
    @dev Check the token balance of a wallet in a token contract

    Returns the balance of the token for user. Avoids possible errors:
      - return 0 on non-contract address
    **/
    function balanceOf(address user, address token)
        public
        view
        returns (uint256)
    {
        if (token == MOCK_ETH_ADDRESS) {
            return user.balance; // ETH balance
            // check if token is actually a contract
        } else if (token.isContract()) {
            return IERC20(token).balanceOf(user);
        }
        revert("INVALID_TOKEN");
    }

    /**
     * @notice Fetches, for a list of _users and _tokens (ETH included with mock address), the balances
     * @param users The list of users
     * @param tokens The list of tokens
     * @return And array with the concatenation of, for each user, his/her balances
     **/
    function batchBalanceOf(address[] calldata users, address[] calldata tokens)
        external
        view
        returns (uint256[] memory)
    {
        uint256[] memory balances = new uint256[](users.length * tokens.length);

        for (uint256 i = 0; i < users.length; i++) {
            for (uint256 j = 0; j < tokens.length; j++) {
                balances[i * tokens.length + j] = balanceOf(
                    users[i],
                    tokens[j]
                );
            }
        }

        return balances;
    }

    /**
    @dev provides balances of user wallet for all reserves available on the pool
    */
    function getUserWalletBalances(address provider, address user)
        external
        view
        returns (address[] memory, uint256[] memory)
    {
        ILendingPool pool = ILendingPool(
            IAddressesProvider(provider).getLendingPool()
        );

        address[] memory reserves = pool.getReservesList();
        address[] memory reservesWithEth = new address[](reserves.length + 1);
        for (uint256 i = 0; i < reserves.length; i++) {
            reservesWithEth[i] = reserves[i];
        }
        reservesWithEth[reserves.length] = MOCK_ETH_ADDRESS;

        uint256[] memory balances = new uint256[](reservesWithEth.length);

        for (uint256 j = 0; j < reserves.length; j++) {
            balances[j] = balanceOf(user, reservesWithEth[j]);
        }
        balances[reserves.length] = balanceOf(user, MOCK_ETH_ADDRESS);

        return (reservesWithEth, balances);
    }

    /**
    @dev provides price in usd of an asset using its symbol
    */
    function getPriceInUsd(bytes32 symbol) public view returns (int256) {
        AggregatorV3Interface source = assetsSources[symbol];

        (, int256 price, , , ) = source.latestRoundData();

        return price;
    }
}
