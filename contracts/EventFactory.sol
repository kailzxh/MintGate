// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./TicketNFT.sol";

contract EventFactory is ERC1155, Ownable, IERC1155Receiver {
    using Counters for Counters.Counter;
    Counters.Counter private _eventIds;

    TicketNFT public ticketNFT;

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
    event TicketPurchased(uint256 indexed eventId, address indexed buyer, uint256 amount);
    event DebugTimestamps(uint256 nowTime, uint256 inputDate);

    constructor() ERC1155("ipfs://") Ownable() {}

    function setTicketNFTContract(address _ticketNFT) external onlyOwner {
        ticketNFT = TicketNFT(_ticketNFT);
    }

    function createEvent(
        string memory name,
        uint256 date,
        string memory ipfsCID,
        string memory imageCID,
        uint256 maxTickets,
        uint256 pricePerTicket
    ) external returns (uint256) {
        emit DebugTimestamps(block.timestamp, date);
        require(date >= block.timestamp, "Event date must be >= now");
        require(bytes(ipfsCID).length > 0, "IPFS CID required");
        require(bytes(imageCID).length > 0, "Image CID required");
        require(maxTickets > 0, "Ticket supply must be > 0");

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

        // Mint all tickets to the EventFactory itself
        _mint(address(this), eventId, maxTickets, "");

        emit EventCreated(eventId, msg.sender, ipfsCID, imageCID);
        return eventId;
    }

    function uri(uint256 eventId) public view override returns (string memory) {
        return string(abi.encodePacked("ipfs://", events[eventId].ipfsCID, "/metadata.json"));
    }

    function isValidEvent(uint256 eventId) public view returns (bool) {
        return events[eventId].active && events[eventId].date > block.timestamp;
    }

    function purchaseTicket(uint256 eventId, uint256 amount) external payable {
        Event storage evt = events[eventId];
        require(evt.active, "Event not active");
        require(evt.date > block.timestamp, "Event has occurred");

        uint256 totalPrice = evt.pricePerTicket * amount;
        require(msg.value >= totalPrice, "Insufficient payment");

        uint256 factoryBalance = balanceOf(address(this), eventId);
        require(factoryBalance >= amount, "Not enough tickets");

        // Burn ERC-1155 tickets from EventFactory
        _burn(address(this), eventId, amount);

        // Mint ERC-721 tickets to buyer
        for (uint256 i = 0; i < amount; i++) {
            ticketNFT.mintTicket(msg.sender, eventId, evt.ipfsCID);
        }

        // Payout to event creator
        (bool sent,) = payable(evt.owner).call{value: totalPrice}("");
        require(sent, "Payout failed");

        // Refund extra if any
        if (msg.value > totalPrice) {
            (bool refund,) = payable(msg.sender).call{value: msg.value - totalPrice}("");
            require(refund, "Refund failed");
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
            balanceOf(address(this), eventId)
        );
    }

    function ticketBalanceOf(address user, uint256 eventId) external view returns (uint256) {
        return balanceOf(user, eventId);
    }

    // ========== IERC1155Receiver ==========

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155, IERC165)
        returns (bool)
    {
        return super.supportsInterface(interfaceId) || interfaceId == type(IERC1155Receiver).interfaceId;
    }
}
