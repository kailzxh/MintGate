// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./TicketNFT.sol";

contract POAPDistributor is ERC1155, Ownable {
    TicketNFT public ticketContract;
    
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    mapping(uint256 => string) private _uris;

    event POAPMinted(uint256 indexed eventId, address indexed attendee);

    constructor(address ticketAddress) ERC1155("") Ownable() {
        ticketContract = TicketNFT(ticketAddress);
    }

    function mintPOAP(address attendee, uint256 eventId, string memory tokenURI) external onlyOwner {
        require(!hasClaimed[eventId][attendee], "POAP already claimed");
        require(isVerifiedAttendee(attendee, eventId), "Not a verified attendee");

        _mint(attendee, eventId, 1, "");
        _uris[eventId] = tokenURI;
        hasClaimed[eventId][attendee] = true;

        emit POAPMinted(eventId, attendee);
    }

    function isVerifiedAttendee(address attendee, uint256 eventId) public view returns (bool) {
        // Implementation would check ticket ownership and attendance verification
        return true; // Simplified for demo
    }

    function uri(uint256 eventId) public view override returns (string memory) {
        return _uris[eventId];
    }
}
