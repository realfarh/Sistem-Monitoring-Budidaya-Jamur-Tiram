
// FILE INI DIBUAT SECARA OTOMATIS OLEH deploy.js
// JANGAN DIEDIT SECARA MANUAL

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const contractABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "readingId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "location",
        "type": "string"
      }
    ],
    "name": "NewReading",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_location",
        "type": "string"
      },
      {
        "internalType": "int256",
        "name": "_temperature",
        "type": "int256"
      },
      {
        "internalType": "uint256",
        "name": "_humidity",
        "type": "uint256"
      }
    ],
    "name": "addReading",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getReadingsCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "readings",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "location",
        "type": "string"
      },
      {
        "internalType": "int256",
        "name": "temperature",
        "type": "int256"
      },
      {
        "internalType": "uint256",
        "name": "humidity",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
    