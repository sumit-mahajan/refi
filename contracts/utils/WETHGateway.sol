// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {IWETH} from "../interfaces/IWETH.sol";
import {IWETHGateway} from "../interfaces/IWETHGateway.sol";
import {ILendingPool} from "../interfaces/ILendingPool.sol";
import {IAToken} from "../interfaces/IAToken.sol";
import {ReserveConfiguration} from "../libraries/configuration/ReserveConfiguration.sol";
import {UserConfiguration} from "../libraries/configuration/UserConfiguration.sol";
import {DataTypes} from "../libraries/utils/DataTypes.sol";

contract WETHGateway is IWETHGateway, Ownable {
    using ReserveConfiguration for DataTypes.ReserveConfigurationMap;
    using UserConfiguration for DataTypes.UserConfigurationMap;

    IWETH internal immutable WETH;
    address internal immutable lendingPool;
    address internal immutable refiCollection;

    /**
     * @dev Sets the WETH address and the LendingPoolAddressesProvider address. Infinite approves lending pool.
     * @param weth Address of the Wrapped Ether contract
     **/
    constructor(
        address weth,
        address _lendingPool,
        address _refiCollection
    ) {
        WETH = IWETH(weth);
        lendingPool = _lendingPool;
        refiCollection = _refiCollection;

        // Infinite approve lendingPool for WETH transfer from wEthGateway
        IWETH(weth).approve(_lendingPool, type(uint256).max);
    }

    /**
     * @dev deposits WETH into the reserve, using native ETH. A corresponding amount of the overlying asset (aTokens)
     * is minted.
     **/
    function depositETH() external payable override {
        WETH.deposit{value: msg.value}();
        ILendingPool(lendingPool).deposit(address(WETH), msg.value, msg.sender);
    }

    /**
     * @dev borrow WETH, unwraps to ETH and send both the ETH and DebtTokens to msg.sender, via `approveDelegation` and onBehalf argument in `LendingPool.borrow`.
     * @param amount the amount of ETH to borrow
     */
    function borrowETH(uint256 amount, address onBehalfOf) external override {
        require(msg.sender == onBehalfOf || msg.sender == refiCollection);
        ILendingPool(lendingPool).borrow(address(WETH), amount, onBehalfOf);
        WETH.withdraw(amount);
        _safeTransferETH(msg.sender, amount);
    }

    /**
     * @dev repays a borrow on the WETH reserve, for the specified amount (or for the whole amount, if uint256(-1) is specified).
     * @param amount the amount to repay, or uint256(-1) if the user wants to repay everything
     */
    function repayETH(uint256 amount) external payable override {
        uint256 paybackAmount = IERC20(
            ILendingPool(lendingPool)
                .getReserveData(address(WETH))
                .variableDebtTokenAddress
        ).balanceOf(msg.sender);

        if (amount < paybackAmount) {
            paybackAmount = amount;
        }
        require(
            msg.value >= paybackAmount,
            "msg.value is less than repayment amount"
        );
        WETH.deposit{value: paybackAmount}();
        ILendingPool(lendingPool).repay(address(WETH), msg.value, msg.sender);

        // refund remaining dust eth
        if (msg.value > paybackAmount)
            _safeTransferETH(msg.sender, msg.value - paybackAmount);
    }

    /**
     * @dev withdraws the WETH _reserves of msg.sender.
     * @param amount amount of aWETH to withdraw and receive native ETH
     */
    function withdrawETH(uint256 amount) external override {
        IAToken aWETH = IAToken(
            ILendingPool(lendingPool)
                .getReserveData(address(WETH))
                .aTokenAddress
        );
        uint256 userBalance = aWETH.balanceOf(msg.sender);
        uint256 amountToWithdraw = amount;

        // if amount is equal to uint(-1), the user wants to redeem everything
        if (amount == type(uint256).max) {
            amountToWithdraw = userBalance;
        }

        aWETH.transferFrom(msg.sender, address(this), amountToWithdraw);
        ILendingPool(lendingPool).withdrawETH(
            address(WETH),
            amountToWithdraw,
            address(this),
            msg.sender
        );

        WETH.withdraw(amountToWithdraw);
        _safeTransferETH(msg.sender, amountToWithdraw);
    }

    /**
     * @dev transfer ETH to an address, revert if it fails.
     * @param to recipient of the transfer
     * @param value the amount to send
     */
    function _safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, "ETH_TRANSFER_FAILED");
    }

    /**
     * @dev transfer ERC20 from the utility contract, for ERC20 recovery in case of stuck tokens due
     * direct transfers to the contract address.
     * @param token token to transfer
     * @param to recipient of the transfer
     * @param amount amount to send
     */
    function emergencyTokenTransfer(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        IERC20(token).transfer(to, amount);
    }

    /**
     * @dev transfer native Ether from the utility contract, for native Ether recovery in case of stuck Ether
     * due selfdestructs or transfer ether to pre-computated contract address before deployment.
     * @param to recipient of the transfer
     * @param amount amount to send
     */
    function emergencyEtherTransfer(address to, uint256 amount)
        external
        onlyOwner
    {
        _safeTransferETH(to, amount);
    }

    /**
     * @dev Get WETH address used by WETHGateway
     */
    function getWETHAddress() external view returns (address) {
        return address(WETH);
    }

    /**
     * @dev Only WETH contract is allowed to transfer ETH here. Prevent other addresses to send Ether to this contract.
     */
    receive() external payable {
        require(msg.sender == address(WETH), "Receive not allowed");
    }

    /**
     * @dev Revert fallback calls
     */
    fallback() external payable {
        revert("Fallback not allowed");
    }
}
