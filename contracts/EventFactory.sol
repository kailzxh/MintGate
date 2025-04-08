// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract EventFactory is ERC1155, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _eventIds;

    struct Event {
        string name;
        uint256 date;
        string ipfsCID;
        address owner;
        bool active;
    }

    mapping(uint256 => Event) public events;

    event EventCreated(uint256 indexed eventId, address indexed owner, string ipfsCID);

    constructor() ERC1155("") Ownable() {}

    function createEvent(
        string memory name,
        uint256 date,
        string memory ipfsCID,
        uint256 maxTickets
    ) external returns (uint256) {
        require(date > block.timestamp, "Event date must be in the future");
        require(bytes(ipfsCID).length > 0, "IPFS CID required");

        _eventIds.increment();
        uint256 eventId = _eventIds.current();

        events[eventId] = Event({
            name: name,
            date: date,
            ipfsCID: ipfsCID,
            owner: msg.sender,
            active: true
        });

        _mint(msg.sender, eventId, maxTickets, "");

        emit EventCreated(eventId, msg.sender, ipfsCID);
        return eventId;
    }

    function uri(uint256 eventId) public view override returns (string memory) {
        return string(abi.encodePacked("ipfs://", events[eventId].ipfsCID, "/metadata.json"));
    }

    function isValidEvent(uint256 eventId) public view returns (bool) {
        return events[eventId].active && events[eventId].date > block.timestamp;
    }
}
