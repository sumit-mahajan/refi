// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

import {IAddressesProvider} from "../interfaces/IAddressesProvider.sol";
import {ILendingPool} from "../interfaces/ILendingPool.sol";
import {IWETHGateway} from "../interfaces/IWETHGateway.sol";

import {DataTypes} from "../libraries/utils/DataTypes.sol";
import {Base64} from "../libraries/utils/Base64.sol";
import "hardhat/console.sol";

contract RefiCollection is ERC721 {
    // Maintaining a counter of number of nfts in collection
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Mapping to store all NFT tokenId -> metadata
    mapping(uint256 => Metadata) private metadatas;

    // Mapping to maintain user address to tokenId
    mapping(address => uint256) private userToTokenId;

    address private immutable LENDING_POOL;
    address private immutable ADDRESSES_PROVIDER;

    struct Metadata {
        string name;
        string description;
        string bronzeCardCID;
        string silverCardCID;
        string goldCardCID;
        string platinumCardCID;
    }

    constructor(address lendingPoolAddr, address addressesProviderAddr)
        ERC721("Refi Protocol", "REFI")
    {
        LENDING_POOL = lendingPoolAddr;
        ADDRESSES_PROVIDER = addressesProviderAddr;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721) {
        super._beforeTokenTransfer(from, to, tokenId);
        require(
            from == address(0),
            "Only minting is allowed. These NFTs can't be burned or transferred"
        );
        require(balanceOf(to) == 0, "Only one card per user");
    }

    function mint(
        string memory _description,
        string memory _bronzeCardCID,
        string memory _silverCardCID,
        string memory _goldCardCID,
        string memory _platinumCardCID
    ) public {
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        _safeMint(msg.sender, tokenId);

        metadatas[tokenId] = Metadata({
            name: string(abi.encodePacked("Refi Card #", tokenId)),
            description: _description,
            bronzeCardCID: _bronzeCardCID,
            silverCardCID: _silverCardCID,
            goldCardCID: _goldCardCID,
            platinumCardCID: _platinumCardCID
        });

        userToTokenId[msg.sender] = tokenId;
    }

    function getImageURL(uint256 tokenId, address owner)
        internal
        view
        returns (string memory)
    {
        (DataTypes.UserClass uc, ) = ILendingPool(LENDING_POOL).getUserClass(
            owner
        );

        Metadata memory meta = metadatas[tokenId];

        string memory cid;

        if (uc == DataTypes.UserClass.Platinum) {
            cid = meta.platinumCardCID;
        } else if (uc == DataTypes.UserClass.Gold) {
            cid = meta.goldCardCID;
        } else if (uc == DataTypes.UserClass.Silver) {
            cid = meta.silverCardCID;
        } else {
            cid = meta.bronzeCardCID;
        }

        return string(abi.encodePacked("https://ipfs.io/ipfs/", cid));
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721)
        returns (string memory)
    {
        // First get the owners address from tokenId
        address owner = ownerOf(tokenId);

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "',
                        metadatas[tokenId].name,
                        '",',
                        '"description": "',
                        metadatas[tokenId].description,
                        '",',
                        '"image": "',
                        getImageURL(tokenId, owner),
                        '"',
                        "}"
                    )
                )
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function getTokenId(address owner) public view returns (uint256 token) {
        return userToTokenId[owner];
    }

    function getBorrowLimit(address user)
        public
        view
        returns (uint256 availableBorrowsETH)
    {
        (, , availableBorrowsETH, , , ) = ILendingPool(LENDING_POOL)
            .getUserAccountData(user);

        return availableBorrowsETH;
    }

    /**
     * @dev transfer ETH to an address, revert if it fails.
     * @param to recipient of the transfer
     * @param value the amount to send
     */
    function _safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, "CARD_ETH_TRANSFER_FAILED");
    }

    function payETHUsingCard(uint256 amount, address toRecieve) external {
        require(getTokenId(msg.sender) != 0, "Caller doesn't have a card");
        IWETHGateway(IAddressesProvider(ADDRESSES_PROVIDER).getWETHGateway())
            .borrowETH(amount, msg.sender);
        _safeTransferETH(toRecieve, amount);
    }

    function payUsingCard(
        address asset,
        uint256 amount,
        address toRecieve
    ) external {
        require(getTokenId(msg.sender) != 0, "Caller doesn't have a card");
        ILendingPool(LENDING_POOL).borrow(asset, amount, msg.sender);
        IERC20(asset).transfer(toRecieve, amount);
    }

    receive() external payable {}

    // Only for test use
    function refresh() external {}
}
