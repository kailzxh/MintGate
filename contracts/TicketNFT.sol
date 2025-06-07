// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./EventFactory.sol";

contract TicketNFT is ERC721, Ownable {
    uint256 private _tokenIds;
    event TicketBurned(uint256 indexed tokenId, uint256 indexed eventId, address indexed owner);
    event TicketMinted(uint256 indexed tokenId, address indexed attendee, uint256 indexed eventId);
    event TicketUsed(uint256 indexed tokenId, uint256 indexed eventId, address indexed owner);

    EventFactory public eventFactory;

    struct Ticket {
        uint256 eventId;
        string ipfsCID;
        bool used;
    }

    mapping(uint256 => Ticket) public tickets;

    constructor(address eventFactoryAddress) ERC721("Event Ticket", "TICKET") Ownable() {
        eventFactory = EventFactory(eventFactoryAddress);
    }

    address public minter;

    modifier onlyMinter() {
        require(msg.sender == minter, "Not authorized to mint");
        _;
    }

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
    }

    function mintTicket(address attendee, uint256 eventId, string memory ipfsCID) external onlyMinter {
    require(eventFactory.isValidEvent(eventId), "Invalid or expired event");
    uint256 tokenId = _tokenIds;
    _tokenIds += 1;
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
    
    function useTicket(uint256 tokenId) external onlyMinter {
        _requireMinted(tokenId);
        require(!tickets[tokenId].used, "Ticket already used");
        tickets[tokenId].used = true;

        emit TicketUsed(tokenId, tickets[tokenId].eventId, ownerOf(tokenId));
    }

    function isTicketUsed(uint256 tokenId) external view returns (bool) {
        _requireMinted(tokenId);
        return tickets[tokenId].used;
    }

    function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId,
    uint256 batchSize
    ) internal override {
    super._beforeTokenTransfer(from, to, tokenId, batchSize);

    
    if (from != address(0) && to != address(0)) {
        require(!tickets[tokenId].used, "Ticket: used ticket cannot be transferred");
    }
    }

    function burnTicket(uint256 tokenId) external onlyOwner {
    _requireMinted(tokenId);
    uint256 eventId = tickets[tokenId].eventId;
    address ticketOwner = ownerOf(tokenId);

    _burn(tokenId);
    delete tickets[tokenId];

    emit TicketBurned(tokenId, eventId, ticketOwner);
}
}