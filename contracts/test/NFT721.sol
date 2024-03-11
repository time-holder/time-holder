// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFT721 is ERC721 {
  constructor() ERC721("NFT721", "NFT721") {}

  function safeMint(address to, uint256 tokenId)
  public {
    _safeMint(to, tokenId);
  }
}
