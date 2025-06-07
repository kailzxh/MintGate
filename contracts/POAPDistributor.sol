// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./TicketNFT.sol";

contract POAPDistributor is ERC1155, Ownable {
    TicketNFT public ticketContract;

    mapping(uint256 => mapping(address => bool)) private _hasClaimed;
    mapping(uint256 => string) private _uris;

    event POAPMinted(uint256 indexed eventId, address indexed attendee);

    constructor(address ticketAddress) ERC1155("") Ownable() {
        ticketContract = TicketNFT(ticketAddress);
    }

    function setEventURI(uint256 eventId, string memory tokenURI) external onlyOwner {
        _uris[eventId] = tokenURI;
    }

    function claimPOAP(uint256 eventId) external {
        address attendee = msg.sender;
        require(!_hasClaimed[eventId][attendee], "POAP already claimed");
        require(isVerifiedAttendee(attendee, eventId), "Not a verified attendee");

        _mint(attendee, eventId, 1, "");
        _hasClaimed[eventId][attendee] = true;

        emit POAPMinted(eventId, attendee);
    }

    function isVerifiedAttendee(address attendee, uint256 eventId) public view returns (bool) {
        uint256 balance = ticketContract.balanceOf(attendee);
        if (balance == 0) return false;

        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = ticketContract.tokenOfOwnerByIndex(attendee, i);
            try ticketContract.getTicketEventId(tokenId) returns (uint256 ticketEventId) {
                bool used = ticketContract.isTicketUsed(tokenId);
                if (ticketEventId == eventId && !used) {
                    return true;
                }
            } catch {
                continue;
            }
        }
        return false;
    }

    function hasClaimed(uint256 eventId, address attendee) external view returns (bool) {
        return _hasClaimed[eventId][attendee];
    }

    function uri(uint256 eventId) public view override returns (string memory) {
        string memory eventURI = _uris[eventId];
        require(bytes(eventURI).length > 0, "URI not set for event");
        return eventURI;
    }
}
