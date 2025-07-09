// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./TicketNFT.sol";

contract POAPDistributor is ERC1155, Ownable {
    TicketNFT public ticketContract;

    // Track if an attendee has claimed POAP for a given event
    mapping(uint256 => mapping(address => bool)) private _hasClaimed;

    // Store IPFS CIDs for each event (without the "ipfs://" prefix)
    mapping(uint256 => string) private _eventCIDs;

    event POAPMinted(uint256 indexed eventId, address indexed attendee);

    modifier eventExists(uint256 eventId) {
        require(bytes(_eventCIDs[eventId]).length > 0, "POAP: Event not registered");
        _;
    }

    constructor(address ticketAddress) ERC1155("ipfs://") Ownable() {
        require(ticketAddress != address(0), "Invalid ticket contract address");
        ticketContract = TicketNFT(ticketAddress);
    }

    /// @notice Set IPFS CID for a POAP event (metadata stored at <CID>/metadata.json)
    function setEventURI(uint256 eventId, string memory cid) external onlyOwner {
        require(bytes(cid).length > 0, "POAP: CID cannot be empty");
        _eventCIDs[eventId] = cid;
    }

    /// @notice Claim your POAP for a given event, if holding a valid unused ticket
    function claimPOAP(uint256 eventId) external eventExists(eventId) {
        address attendee = msg.sender;

        require(!_hasClaimed[eventId][attendee], "POAP: Already claimed");
        require(_isVerifiedAttendee(attendee, eventId), "POAP: Invalid or used ticket");

        _mint(attendee, eventId, 1, "");
        _hasClaimed[eventId][attendee] = true;

        emit POAPMinted(eventId, attendee);
    }

    /// @dev Internal function: checks if the attendee holds any unused ticket for the event
    function _isVerifiedAttendee(address attendee, uint256 eventId) internal view returns (bool) {
        uint256 balance = ticketContract.balanceOf(attendee);
        if (balance == 0) return false;

        for (uint256 i = 0; i < balance; ++i) {
            try ticketContract.tokenOfOwnerByIndex(attendee, i) returns (uint256 tokenId) {
                try ticketContract.getTicketEventId(tokenId) returns (uint256 eid) {
                    if (eid == eventId && !ticketContract.isTicketUsed(tokenId)) {
                        return true;
                    }
                } catch {} // ignore failed getTicketEventId
            } catch {} // ignore failed tokenOfOwnerByIndex
        }

        return false;
    }

    /// @notice Check if a user has claimed the POAP for a given event
    function hasClaimed(uint256 eventId, address attendee) external view returns (bool) {
        return _hasClaimed[eventId][attendee];
    }

    /// @notice View the IPFS URI for a POAP event (points to metadata.json)
    function uri(uint256 eventId) public view override eventExists(eventId) returns (string memory) {
        return string(abi.encodePacked("ipfs://", _eventCIDs[eventId], "/metadata.json"));
    }

    /// @notice Optional: returns raw CID for frontend use
    function getEventCID(uint256 eventId) external view eventExists(eventId) returns (string memory) {
        return _eventCIDs[eventId];
    }
}
