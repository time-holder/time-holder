// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract NFT1155 is ERC1155 {
  constructor() ERC1155("") {}

  function mint(address account, uint256 id, uint256 amount, bytes calldata data)
  public {
    _mint(account, id, amount, data);
  }

  function mintBatch(address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data)
  public {
    _mintBatch(to, ids, amounts, data);
  }
}
