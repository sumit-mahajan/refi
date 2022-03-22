// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import {ILendingPool} from "../interfaces/ILendingPool.sol";

import {DataTypes} from "../libraries/utils/DataTypes.sol";
import {Base64} from "../libraries/utils/Base64.sol";

contract RefiCollection is ERC721{

    // Maintaining a counter of number of nfts in collection
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Mapping to store all NFT tokenId -> metadata
    mapping(uint256 => Metadata) private metadatas;

    address private immutable LENDING_POOL;

    struct Metadata {
        string name;
        string description;
        string bronzeCardURL;
        string silverCardURL;
        string goldCardURL;
        string diamondCardURL;
    }

    constructor(address lendingPoolAddr) ERC721("Refi Protocol", "REFI") {
        LENDING_POOL = lendingPoolAddr;
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override(ERC721)
    {
        super._beforeTokenTransfer(from, to, tokenId);
        require(from == address(0), "Only minting is allowed. These NFTs can't be burned or transferred");
    }

    function mint(
        string memory _name,
        string memory _description,
        string memory _bronzeCardURL,
        string memory _silverCardURL,
        string memory _goldCardURL,
        string memory _diamondCardURL
    ) public {
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        _safeMint(msg.sender, tokenId);

        metadatas[tokenId] = Metadata({
            name: _name,
            description: _description,
            bronzeCardURL: _bronzeCardURL,
            silverCardURL: _silverCardURL,
            goldCardURL: _goldCardURL,
            diamondCardURL: _diamondCardURL
        });
    }

    function getImageURL(uint256 tokenId, address owner) internal view returns (string memory) {
        DataTypes.UserClass uc = ILendingPool(LENDING_POOL).getUserClass(owner);

        Metadata memory meta = metadatas[tokenId];

        string memory url;

        if (uc == DataTypes.UserClass.Diamond) {
            url = meta.diamondCardURL;
        } else if (uc == DataTypes.UserClass.Gold) {
            url = meta.goldCardURL;
        } else if (uc == DataTypes.UserClass.Silver) {
            url = meta.silverCardURL;
        } else {
            url = meta.bronzeCardURL;
        }

        return url;
    }

    function tokenURI(uint256 tokenId) override(ERC721) public view returns (string memory) {

        // First get the owners address from tokenId
        address owner = ownerOf(tokenId); 

        string memory json = Base64.encode(
            bytes(string(
                abi.encodePacked(
                    '{"name": "', metadatas[tokenId].name, '",',
                    '"description": "', metadatas[tokenId].description, '",',
                    '"image": "', getImageURL(tokenId, owner), '"',
                    '}'
                )
            ))
        );
        return string(abi.encodePacked('data:application/json;base64,', json));
    }    
}