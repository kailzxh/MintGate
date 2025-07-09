// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./EventFactory.sol";

contract TicketNFT is ERC721Enumerable, Ownable {
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
    event TicketUsed(uint256 indexed tokenId, uint256 indexed eventId, address indexed owner);
    event TicketBurned(uint256 indexed tokenId, uint256 indexed eventId, address indexed owner);

    modifier onlyFactory() {
        require(msg.sender == address(eventFactory), "Not authorized: Only factory");
        _;
    }

    constructor(address _eventFactory) ERC721("Event Ticket", "TICKET") {
        require(_eventFactory != address(0), "Invalid EventFactory address");
        eventFactory = EventFactory(_eventFactory);
    }

    function mintTicket(address attendee, uint256 eventId, string memory ipfsCID) external onlyFactory {
        require(eventFactory.isValidEvent(eventId), "Invalid or expired event");
        require(attendee != address(0), "Invalid attendee address");

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

    function useTicket(uint256 tokenId) external onlyFactory {
        _requireMinted(tokenId);
        require(!tickets[tokenId].used, "Ticket already used");

        tickets[tokenId].used = true;
        emit TicketUsed(tokenId, tickets[tokenId].eventId, ownerOf(tokenId));
    }

    function isTicketUsed(uint256 tokenId) external view returns (bool) {
        _requireMinted(tokenId);
        return tickets[tokenId].used;
    }

    function getTicketEventId(uint256 tokenId) external view returns (uint256) {
        _requireMinted(tokenId);
        return tickets[tokenId].eventId;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);

        // Disallow transfer of used tickets
        if (from != address(0) && to != address(0)) {
            require(!tickets[tokenId].used, "Used ticket cannot be transferred");
        }
    }

    function burnTicket(uint256 tokenId) external onlyOwner {
        _requireMinted(tokenId);

        address ticketOwner = ownerOf(tokenId);
        uint256 eventId = tickets[tokenId].eventId;

        _burn(tokenId);
        delete tickets[tokenId];

        emit TicketBurned(tokenId, eventId, ticketOwner);
    }
}
