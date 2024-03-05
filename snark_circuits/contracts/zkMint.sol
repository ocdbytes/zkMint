// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Verifier} from "./ZkmintVerifier.sol";
import "hardhat/console.sol";

contract zkMint is ERC721 {
    uint256 public hash = uint256(13685342771307086727788352245295811587294570533216871320031667359854616932584);
    uint256 public nextTokenId;
    Verifier public verifier;

    mapping(uint256 => bool) public nullifiers;

    constructor(Verifier _verifier) ERC721("ZKMINTTOKEN", "ZKMNT") {
        verifier = _verifier;
    }

    function mintWithProof(uint256 _nullifier, uint256[2] memory _a, uint256[2][2] memory _b, uint256[2] memory _c) public returns(bool res) {

        require(nullifiers[_nullifier] == false, "zkMint : nullifier used");

        uint256[3] memory publicInputs = [
            _nullifier,
            hash,
            uint256(uint160(address(msg.sender)))
        ];

        // console.log("nullifier : ",publicInputs[0]);
        // console.log("hash : ",publicInputs[1]);
        // console.log("address : ",publicInputs[2]);
        // console.log("msg.sender : ",msg.sender);

        require(verifier.verifyProof(_a,_b,_c,publicInputs), "zkMint : invalid proof");

        nullifiers[_nullifier] = true;

        _safeMint(msg.sender, nextTokenId);
        nextTokenId++;

        return true;
    }
}