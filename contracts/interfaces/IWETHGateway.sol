// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

interface IWETHGateway {
    function depositETH() external payable;

    function withdrawETH(uint256 amount) external;

    function repayETH(uint256 amount) external payable;

    function borrowETH(uint256 amount) external;
}
