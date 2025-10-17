// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";
import {ValidationRegistry} from "../src/ValidationRegistry.sol";

contract ValidationRegistryTest is Test {
    IdentityRegistry identity;
    ValidationRegistry validation;

    address agentOwner;
    address validator;
    address attacker;

    function setUp() public {
        identity = new IdentityRegistry();
        validation = new ValidationRegistry(address(identity));
        agentOwner = makeAddr("agentOwner");
        validator = makeAddr("validator");
        attacker = makeAddr("attacker");
        vm.deal(agentOwner, 100 ether);
        vm.deal(validator, 100 ether);
        vm.deal(attacker, 100 ether);
    }

    function _registerAgentAs(address owner, string memory uri) internal returns (uint256 agentId) {
        vm.startPrank(owner);
        agentId = identity.register(uri);
        vm.stopPrank();
    }

    function test_CreateRequestAndRespond() public {
        uint256 agentId = _registerAgentAs(agentOwner, "ipfs://agent");

        bytes32 reqHash = keccak256("request");
        vm.prank(agentOwner);
        validation.validationRequest(validator, agentId, "ipfs://req", reqHash);

        // Only validator can respond
        vm.expectRevert(bytes("not validator"));
        vm.prank(attacker);
        validation.validationResponse(reqHash, 50, "ipfs://resp", keccak256("r"), keccak256("tag"));

        vm.prank(validator);
        validation.validationResponse(reqHash, 100, "ipfs://resp", keccak256("r"), keccak256("passed"));

        (address vAddr, uint256 aId, uint8 resp, bytes32 rHash, bytes32 tag,) = validation.getValidationStatus(reqHash);
        assertEq(vAddr, validator);
        assertEq(aId, agentId);
        assertEq(resp, 100);
        assertEq(rHash, keccak256("r"));
        assertEq(tag, keccak256("passed"));
    }

    function test_PermissionsOnRequest() public {
        uint256 agentId = _registerAgentAs(agentOwner, "ipfs://agent");
        bytes32 reqHash = keccak256("req");

        vm.expectRevert(bytes("Not authorized"));
        vm.prank(attacker);
        validation.validationRequest(validator, agentId, "ipfs://req", reqHash);

        vm.prank(agentOwner);
        validation.validationRequest(validator, agentId, "ipfs://req", reqHash);
    }

    function test_SummaryAndTracking() public {
        uint256 agentId = _registerAgentAs(agentOwner, "ipfs://agent");
        vm.prank(agentOwner);
        validation.validationRequest(validator, agentId, "ipfs://req1", keccak256("req1"));
        vm.prank(agentOwner);
        validation.validationRequest(address(0xC0FFEE), agentId, "ipfs://req2", keccak256("req2"));

        vm.prank(validator);
        validation.validationResponse(keccak256("req1"), 80, "", keccak256("r1"), keccak256("tag"));
        vm.prank(address(0xC0FFEE));
        validation.validationResponse(keccak256("req2"), 100, "", keccak256("r2"), keccak256("tag"));

        (uint64 count, uint8 avg) = validation.getSummary(agentId, new address[](0), bytes32(0));
        assertEq(count, 2);
        assertEq(avg, 90);

        bytes32[] memory agentReqs = validation.getAgentValidations(agentId);
        assertEq(agentReqs.length, 2);

        bytes32[] memory valReqs = validation.getValidatorRequests(validator);
        assertEq(valReqs.length, 1);
        assertEq(valReqs[0], keccak256("req1"));
    }
}


