// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./TicketNFT.sol";

contract POAPDistributor is ERC1155, Ownable {
    TicketNFT public ticketContract;

    // track who’s already claimed per event
    mapping(uint256 => mapping(address => bool)) private _hasClaimed;
    // store just the IPFS CID (no ipfs:// prefix)
    mapping(uint256 => string) private _eventCIDs;

    event POAPMinted(uint256 indexed eventId, address indexed attendee);

    /// @param ticketAddress The deployed TicketNFT contract
    constructor(address ticketAddress) ERC1155("ipfs://") Ownable() {
        ticketContract = TicketNFT(ticketAddress);
    }

    /// @notice Owner sets the IPFS CID for a given event’s POAP metadata folder  
    /// @param eventId The event identifier  
    /// @param cid The raw IPFS CID (e.g. "Qm…") — `ipfs://` is added automatically
    function setEventURI(uint256 eventId, string memory cid) external onlyOwner {
        require(bytes(cid).length > 0, "CID cannot be empty");
        _eventCIDs[eventId] = cid;
    }

    /// @notice Allows an attendee to claim their POAP if they hold an unused ticket
    /// @param eventId The event identifier they’re claiming for
    function claimPOAP(uint256 eventId) external {
        address attendee = msg.sender;
        require(!_hasClaimed[eventId][attendee], "Already claimed");
        require(_isVerifiedAttendee(attendee, eventId), "Not a valid attendee");

        // mint exactly 1 ERC1155 token for this attendee/event
        _mint(attendee, eventId, 1, "");
        _hasClaimed[eventId][attendee] = true;

        emit POAPMinted(eventId, attendee);
    }

    /// @notice Checks if an address holds at least one *unused* ticket NFT for `eventId`
    function _isVerifiedAttendee(address attendee, uint256 eventId) internal view returns (bool) {
        uint256 balance = ticketContract.balanceOf(attendee);
        if (balance == 0) return false;

        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = ticketContract.tokenOfOwnerByIndex(attendee, i);
            // getTicketEventId() may revert if tokenId invalid, so we wrap in try/catch
            try ticketContract.getTicketEventId(tokenId) returns (uint256 tid) {
                if (tid == eventId && !ticketContract.isTicketUsed(tokenId)) {
                    return true;
                }
            } catch {
                continue;
            }
        }
        return false;
    }

    /// @notice External view to check if someone has already claimed
    function hasClaimed(uint256 eventId, address attendee) external view returns (bool) {
        return _hasClaimed[eventId][attendee];
    }

    /// @notice Returns the full `ipfs://<CID>/metadata.json` URI for a given event’s POAP
    function uri(uint256 eventId) public view override returns (string memory) {
        string memory cid = _eventCIDs[eventId];
        require(bytes(cid).length > 0, "URI not set for event");
        // we assume your metadata file is at `<CID>/metadata.json`
        return string(abi.encodePacked("ipfs://", cid, "/metadata.json"));
    }
}
