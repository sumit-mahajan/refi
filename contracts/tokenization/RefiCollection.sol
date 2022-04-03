// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

import {IERC20Detailed} from "../interfaces/base/IERC20Detailed.sol";
import {IAddressesProvider} from "../interfaces/IAddressesProvider.sol";
import {ILendingPool} from "../interfaces/ILendingPool.sol";
import {IWETHGateway} from "../interfaces/IWETHGateway.sol";

import {DataTypes} from "../libraries/utils/DataTypes.sol";
import {Base64} from "../libraries/utils/Base64.sol";

contract RefiCollection is ERC721 {
    // Maintaining a counter of number of nfts in collection
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Mapping to store all NFT tokenId -> metadata
    mapping(uint256 => Metadata) private metadatas;

    // Mapping to maintain user address to tokenId
    mapping(address => uint256) private userToTokenId;

    address private immutable ADDRESSES_PROVIDER;

    struct Metadata {
        string name;
        string description;
        string bronzeCardCID;
        string silverCardCID;
        string goldCardCID;
        string platinumCardCID;
    }

    constructor(address addressesProviderAddr) ERC721("Refi", "REFI") {
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

    /**
    @dev Mints credit card of a user with 4 image CIDs, one for each class of card
    **/
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
            name: string(
                abi.encodePacked("Refi Card #", Strings.toString(tokenId))
            ),
            description: _description,
            bronzeCardCID: _bronzeCardCID,
            silverCardCID: _silverCardCID,
            goldCardCID: _goldCardCID,
            platinumCardCID: _platinumCardCID
        });

        userToTokenId[msg.sender] = tokenId;
    }

    /**
    @dev Checks user's current class and returns the corresponding image
    **/
    function getImageURL(uint256 tokenId, address owner)
        internal
        view
        returns (string memory)
    {
        (DataTypes.UserClass uc, ) = ILendingPool(
            IAddressesProvider(ADDRESSES_PROVIDER).getLendingPool()
        ).getUserClass(owner);

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

    /**
    @dev The function that returns dynamic metadata
    **/
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

    /**
    @dev Returns ETH equivalent borrow limit of a user
    @param user The address of users whose borrow limit is to be checked
    **/
    function getBorrowLimit(address user)
        public
        view
        returns (uint256 availableBorrowsETH)
    {
        (, , availableBorrowsETH, , , ) = ILendingPool(
            IAddressesProvider(ADDRESSES_PROVIDER).getLendingPool()
        ).getUserAccountData(user);

        return availableBorrowsETH;
    }

    /**
    @dev Lets user pay any asset except ETH to anyone. It first borrows the asset and then transfers it
    @param asset The asset in which the payment is made
    @param amount The amount of asset
    @param toRecieve The address that will recieve the amount of asset
    **/
    function payUsingCard(
        address asset,
        uint256 amount,
        address toRecieve
    ) external {
        require(getTokenId(msg.sender) != 0, "Caller doesn't have a card");
        ILendingPool(IAddressesProvider(ADDRESSES_PROVIDER).getLendingPool())
            .borrow(asset, amount, msg.sender);
        IERC20(asset).transfer(toRecieve, amount);
    }

    /**
    @dev Lets user pay ETH to anyone. It first borrows ETH and then transfers it
    @param amount The amount of asset
    @param toRecieve The address that will recieve the amount of asset
    **/
    function payETHUsingCard(uint256 amount, address toRecieve) external {
        require(getTokenId(msg.sender) != 0, "Caller doesn't have a card");
        IWETHGateway(IAddressesProvider(ADDRESSES_PROVIDER).getWETHGateway())
            .borrowETH(amount, msg.sender);
        _safeTransferETH(toRecieve, amount);
    }

    struct TokenDetailedData {
        string symbol;
        address tokenAddress;
        address aTokenAddress;
        address dTokenAddress;
    }

    /** 
    @dev Returns all token symbols and their related contract addresses that support REFI card payments
    */
    function getSupportedAssets()
        external
        view
        returns (TokenDetailedData[] memory)
    {
        ILendingPool pool = ILendingPool(
            IAddressesProvider(ADDRESSES_PROVIDER).getLendingPool()
        );
        address[] memory reserves = pool.getReservesList();
        TokenDetailedData[] memory reservesTokens = new TokenDetailedData[](
            reserves.length
        );
        for (uint256 i = 0; i < reserves.length; i++) {
            DataTypes.ReserveData memory reserve = pool.getReserveData(
                reserves[i]
            );

            string memory symbol = IERC20Detailed(reserves[i]).symbol();
            // bytes32 symbolInBytes;
            // assembly {
            //     symbolInBytes := mload(add(symbol, 32))
            // }

            // int256 priceInUsd = IWalletBalanceProvider(
            //     IAddressesProvider(ADDRESSES_PROVIDER).walletBalanceProvider()
            // ).getPriceInUsd(symbolInBytes);

            reservesTokens[i] = TokenDetailedData({
                symbol: symbol,
                tokenAddress: reserves[i],
                aTokenAddress: reserve.aTokenAddress,
                dTokenAddress: reserve.variableDebtTokenAddress
                // priceInUsd: priceInUsd
            });
        }
        return reservesTokens;
    }

    /**
     * @dev Internal transfer ETH to an address, revert if it fails.
     * @param to recipient of the transfer
     * @param value the amount to send
     */
    function _safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, "CARD_ETH_TRANSFER_FAILED");
    }

    /**
    @dev Function to reieve ETH
    **/
    receive() external payable {}

    // Only for test use
    function refresh() external {}
}
