// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./EventFactory.sol";

contract TicketNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    EventFactory public eventFactory;

    struct Ticket {
        uint256 eventId;
        string ipfsCID;
        bool used;
    }

    mapping(uint256 => Ticket) public tickets;

    event TicketMinted(uint256 indexed tokenId, address indexed attendee, uint256 indexed eventId);

    constructor(address eventFactoryAddress) ERC721("Event Ticket", "TICKET") Ownable() {
        eventFactory = EventFactory(eventFactoryAddress);
    }

    function mintTicket(address attendee, uint256 eventId, string memory ipfsCID) external {
        require(eventFactory.isValidEvent(eventId), "Invalid or expired event");
        
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        tickets[tokenId] = Ticket({
            eventId: eventId,
            ipfsCID: ipfsCID,
            used: false
        });

        _mint(attendee, tokenId);

        emit TicketMinted(tokenId, attendee, eventId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireMinted(tokenId);
        return string(abi.encodePacked("ipfs://", tickets[tokenId].ipfsCID, "/metadata.json"));
    }
}
