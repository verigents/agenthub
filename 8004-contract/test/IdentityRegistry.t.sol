// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";

contract IdentityRegistryTest is Test {
    IdentityRegistry registry;
    address user;

    function setUp() public {
        registry = new IdentityRegistry();
        user = makeAddr("user");
        vm.deal(user, 1 ether);
    }

    function test_RegisterWithTokenURIAndOwner() public {
        string memory uri = "ipfs://QmTest";
        vm.prank(user);
        uint256 agentId = registry.register(uri);

        assertEq(registry.tokenURI(agentId), uri);
        assertEq(registry.ownerOf(agentId), user);
    }

    function test_RegisterAutoIncrementIds() public {
        vm.startPrank(user);
        uint256 a = registry.register("ipfs://a");
        uint256 b = registry.register("ipfs://b");
        uint256 c = registry.register("ipfs://c");
        vm.stopPrank();
        assertEq(b, a + 1);
        assertEq(c, b + 1);
    }

    function test_UpdateTokenURIByOwnerOrOperator() public {
        vm.prank(user);
        uint256 agentId = registry.register("ipfs://initial");
        vm.prank(user);
        registry.setAgentUri(agentId, "https://example.com/updated.json");
        assertEq(registry.tokenURI(agentId), "https://example.com/updated.json");
    }

    function test_MetadataSetAndGet() public {
        vm.prank(user);
        uint256 agentId = registry.register("ipfs://agent");
        bytes memory val = bytes("0x1234");
        vm.prank(user);
        registry.setMetadata(agentId, "agentWallet", val);
        bytes memory readVal = registry.getMetadata(agentId, "agentWallet");
        assertEq(keccak256(readVal), keccak256(val));
    }
}


