// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import {ILendingPool} from "../interfaces/ILendingPool.sol";

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

    address private immutable LENDING_POOL;

    struct Metadata {
        string name;
        string description;
        string bronzeCardCID;
        string silverCardCID;
        string goldCardCID;
        string platinumCardCID;
    }

    constructor(address lendingPoolAddr) ERC721("Refi Protocol", "REFI") {
        LENDING_POOL = lendingPoolAddr;
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
        string memory _name,
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
            name: _name,
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

    function refresh() external {}
}
