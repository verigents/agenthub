// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";
import {ReputationRegistry} from "../src/ReputationRegistry.sol";
import {MockERC1271Wallet} from "../src/MockERC1271Wallet.sol";

contract ReputationRegistryTest is Test {
    IdentityRegistry identity;
    ReputationRegistry reputation;

    address agentOwner;
    address client;
    uint256 operatorPk;
    address operator;

    function setUp() public {
        identity = new IdentityRegistry();
        reputation = new ReputationRegistry(address(identity));

        // Setup deterministic operator (EOA with known private key)
        operatorPk = 0xBEEF;
        operator = vm.addr(operatorPk);

        // Fund accounts
        agentOwner = makeAddr("agentOwner");
        client = makeAddr("client");
        vm.deal(agentOwner, 100 ether);
        vm.deal(client, 100 ether);
        vm.deal(operator, 100 ether);
    }

    function _registerAgentAs(address owner, string memory uri) internal returns (uint256 agentId) {
        vm.startPrank(owner);
        agentId = identity.register(uri);
        vm.stopPrank();
    }

    function _buildFeedbackAuth(
        uint256 agentId,
        address clientAddr,
        uint256 signerPk,
        address signerAddress
    ) internal view returns (bytes memory) {
        uint64 indexLimit = 100;
        uint256 expiry = block.timestamp + 1 hours;
        uint256 chainId = block.chainid;

        bytes memory encoded = abi.encode(
            agentId,
            clientAddr,
            indexLimit,
            expiry,
            chainId,
            address(identity),
            signerAddress
        );

        // EIP-191 signed message
        bytes32 messageHash = keccak256(encoded);
        bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPk, ethHash);
        bytes memory sig = abi.encodePacked(r, s, v);

        return bytes.concat(encoded, sig);
    }

    function test_GiveFeedbackAndReadBack() public {
        uint256 agentId = _registerAgentAs(agentOwner, "ipfs://agent");

        // Owner approves operator; operator signs auth; client submits
        // set approval to operator
        vm.prank(agentOwner);
        identity.setApprovalForAll(operator, true);
        // use a matching private key that corresponds to operator address
        bytes memory auth = _buildFeedbackAuth(agentId, client, operatorPk, operator);

        vm.prank(client);
        reputation.giveFeedback(agentId, 85, keccak256("quality"), keccak256("speed"), "ipfs://f", keccak256("c"), auth);

        (uint8 score, bytes32 tag1, bytes32 tag2, bool revoked) = reputation.readFeedback(agentId, client, 1);
        assertEq(score, 85);
        assertEq(tag1, keccak256("quality"));
        assertEq(tag2, keccak256("speed"));
        assertEq(revoked, false);
        assertEq(reputation.getLastIndex(agentId, client), 1);
    }

    function test_RevokeFeedback() public {
        uint256 agentId = _registerAgentAs(agentOwner, "ipfs://agent");

        vm.prank(agentOwner);
        identity.setApprovalForAll(operator, true);
        bytes memory auth = _buildFeedbackAuth(agentId, client, operatorPk, operator);

        vm.prank(client);
        reputation.giveFeedback(agentId, 90, bytes32(0), bytes32(0), "", bytes32(0), auth);

        vm.prank(client);
        reputation.revokeFeedback(agentId, 1);

        (, , , bool revoked) = reputation.readFeedback(agentId, client, 1);
        assertTrue(revoked);
    }

    function test_SummaryAverageAndCount() public {
        uint256 agentId = _registerAgentAs(agentOwner, "ipfs://agent");
        vm.prank(agentOwner);
        identity.setApprovalForAll(operator, true);
        bytes memory auth = _buildFeedbackAuth(agentId, client, operatorPk, operator);

        vm.startPrank(client);
        reputation.giveFeedback(agentId, 80, keccak256("t1"), keccak256("t2"), "", bytes32(0), auth);
        reputation.giveFeedback(agentId, 100, keccak256("t1"), keccak256("t2"), "", bytes32(0), auth);
        vm.stopPrank();

        (uint64 count, uint8 avg) = reputation.getSummary(agentId, new address[](0), bytes32(0), bytes32(0));
        assertEq(count, 2);
        assertEq(avg, 90);
    }

    function test_RejectsScoreAbove100() public {
        uint256 agentId = _registerAgentAs(agentOwner, "ipfs://agent");
        vm.prank(agentOwner);
        identity.setApprovalForAll(operator, true);
        bytes memory auth = _buildFeedbackAuth(agentId, client, operatorPk, operator);

        vm.expectRevert(bytes("score>100"));
        vm.prank(client);
        reputation.giveFeedback(agentId, 101, bytes32(0), bytes32(0), "", bytes32(0), auth);
    }

    function test_RejectsInvalidSignature() public {
        uint256 agentId = _registerAgentAs(agentOwner, "ipfs://agent");

        // No approval and wrong signer (unauthorized signer address)
        uint256 badPk = 0xCAFE;
        address badSigner = vm.addr(badPk);
        bytes memory auth = _buildFeedbackAuth(agentId, client, badPk, badSigner);

        vm.expectRevert();
        vm.prank(client);
        reputation.giveFeedback(agentId, 90, bytes32(0), bytes32(0), "", bytes32(0), auth);
    }

    function test_ERC1271WalletSigner() public {
        uint256 agentId = _registerAgentAs(agentOwner, "ipfs://agent");

        // Transfer agent to 1271 wallet
        address walletOwner = vm.addr(0xA11);
        MockERC1271Wallet wallet = new MockERC1271Wallet(walletOwner);

        vm.startPrank(agentOwner);
        identity.transferFrom(agentOwner, address(wallet), agentId);
        vm.stopPrank();

        // Build auth where signer is the wallet; signature by walletOwner must be accepted by wallet
        uint64 indexLimit = 10;
        uint256 expiry = block.timestamp + 1 hours;
        uint256 chainId = block.chainid;
        bytes memory encoded = abi.encode(agentId, client, indexLimit, expiry, chainId, address(identity), address(wallet));
        bytes32 messageHash = keccak256(encoded);
        bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(0xA11, ethHash);
        bytes memory sig = abi.encodePacked(r, s, v);
        bytes memory auth = bytes.concat(encoded, sig);

        vm.prank(client);
        reputation.giveFeedback(agentId, 92, keccak256("erc1271"), bytes32(0), "", bytes32(0), auth);

        (uint8 score,,,) = reputation.readFeedback(agentId, client, 1);
        assertEq(score, 92);
    }
}


