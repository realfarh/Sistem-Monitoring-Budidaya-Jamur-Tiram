// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title Monitoring
 * @dev Kontrak ini mencatat data sensor. Izin pengiriman data telah dibuka untuk tujuan development.
 */
contract Monitoring {
    address public owner;

    struct SensorReading {
        uint256 timestamp;
        string location;
        int256 temperature;
        uint256 humidity;
    }

    SensorReading[] public readings;

    event NewReading(
        uint256 indexed readingId,
        uint256 timestamp,
        string location
    );

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Fungsi untuk menambahkan data sensor baru.
     * --- PERBAIKAN: Modifier 'onlyOwner' telah dihapus ---
     * Sekarang, akun mana pun dapat memanggil fungsi ini.
     */
    function addReading(
        string memory _location,
        int256 _temperature,
        uint256 _humidity
    ) public { // <-- 'onlyOwner' dihapus dari sini
        readings.push(
            SensorReading({
                timestamp: block.timestamp,
                location: _location,
                temperature: _temperature,
                humidity: _humidity
            })
        );

        emit NewReading(readings.length - 1, block.timestamp, _location);
    }

    function getReadingsCount() public view returns (uint256) {
        return readings.length;
    }
}
