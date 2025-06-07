// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract EventFactory is ERC1155, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _eventIds;
    address public ticketNFTContract;

    struct Event {
        string name;
        uint256 date;
        string ipfsCID;
        string imageCID;
        address owner;
        bool active;
        uint256 pricePerTicket; 
    }

    mapping(uint256 => Event) public events;

    event EventCreated(uint256 indexed eventId, address indexed owner, string ipfsCID, string imageCID);


    constructor() ERC1155("") Ownable() {}

    function createEvent(
        string memory name,
        uint256 date,
        string memory ipfsCID,
        string memory imageCID,
        uint256 maxTickets,
        uint256 pricePerTicket

    ) external returns (uint256) {
        require(date > block.timestamp, "Event date must be in the future");
        require(bytes(ipfsCID).length > 0, "IPFS CID required");

        _eventIds.increment();
        uint256 eventId = _eventIds.current();

        events[eventId] = Event({
            name: name,
            date: date,
            ipfsCID: ipfsCID,
            imageCID: imageCID,
            owner: msg.sender,
            active: true,
            pricePerTicket: pricePerTicket
        });

        _mint(msg.sender, eventId, maxTickets, "");

        emit EventCreated(eventId, msg.sender, ipfsCID, imageCID);
        return eventId;
    }

    function uri(uint256 eventId) public view override returns (string memory) {
        return string(abi.encodePacked("ipfs://", events[eventId].ipfsCID, "/metadata.json"));
    }

    function isValidEvent(uint256 eventId) public view returns (bool) {
        return events[eventId].active && events[eventId].date > block.timestamp;
    }

    event TicketPurchased(uint256 indexed eventId, address indexed buyer, uint256 amount);

    function purchaseTicket(uint256 eventId, uint256 amount) external payable {
    Event storage evt = events[eventId];
    require(evt.active, "Event is not active");
    require(evt.date > block.timestamp, "Event has already occurred");

    uint256 totalPrice = evt.pricePerTicket * amount;
    require(msg.value >= totalPrice, "Insufficient payment");

    
    uint256 creatorBalance = balanceOf(evt.owner, eventId);
    require(creatorBalance >= amount, "Not enough tickets remaining");

    
    safeTransferFrom(evt.owner, msg.sender, eventId, amount, "");

    
    (bool success, ) = payable(evt.owner).call{value: totalPrice}("");
    require(success, "Payment transfer failed");

    
    if (msg.value > totalPrice) {
        (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - totalPrice}("");
        require(refundSuccess, "Refund failed");
    }
    emit TicketPurchased(eventId, msg.sender, amount);

    }
    function deactivateEvent(uint256 eventId) external {
    require(events[eventId].owner == msg.sender, "Only event owner can deactivate");
    events[eventId].active = false;
    }


    function getEventDetails(uint256 eventId) external view returns (
    string memory name,
    uint256 date,
    string memory ipfsCID,
    string memory imageCID,   
    address owner,
    bool active,
    uint256 pricePerTicket,
    uint256 ticketsRemaining
    ) {
    Event storage evt = events[eventId];
    return (
        evt.name,
        evt.date,
        evt.ipfsCID,
        evt.imageCID,     
        evt.owner,
        evt.active,
        evt.pricePerTicket,
        balanceOf(evt.owner, eventId)
    );
    }

        
    function setTicketNFTContract(address _ticketNFT) external onlyOwner {
        ticketNFTContract = _ticketNFT;
    }

    function burn(address from, uint256 eventId, uint256 amount) external {
        require(msg.sender == ticketNFTContract, "Only TicketNFT can burn");
        _burn(from, eventId, amount);
    }

    function ticketBalanceOf(address user, uint256 eventId) external view returns (uint256) {
        return balanceOf(user, eventId);
    }



}
