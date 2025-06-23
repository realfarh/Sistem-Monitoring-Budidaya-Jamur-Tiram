# 🍄MushChain: Mushroom Chain Smart Monitoring Untuk Otomatisasi dan Keamanan Data Rantai Pasok Berbasis Blockchain 🍄

---
## Deskripsi Proyek

MushChain adalah **sistem monitoring data sensor temperature dan humidity berbasis Rust**, yang terhubung dengan **InfluxDB, Grafana, Smart Contract Ethereum**, dan antarmuka **GUI PyQt** serta dashboard **Web3 (React)**. Proyek ini dirancang untuk petani jamur skala kecil hingga menengah dengan memberikan solusi IoT + Blockchain + Real-time Dashboard **dalam satu kesatuan sistem**. Dengan dukungan **Decentralized Application (DApp), seluruh catatan lingkungan tumbuh jamur tidak hanya tersimpan secara aman, tetapi juga dapat diverifikasi oleh pihak ketiga seperti distributor dan konsumen, sehingga meningkatkan kepercayaan dan akuntabilitas.** Inovasi ini mendorong digitalisasi pertanian dan membuka jalan bagi pemanfaatan teknologi web3 di sektor agrikultur.

---
## 👷🏻‍♂️Anggota Kelompok👷🏻‍♀️

| Nama               | NRP       |
|---                 |---        |
| Rafi Primansyah    | 2042231014|
| Bambang Pamarta P. | 2042231016|
| Nurlita Farah Laila| 2042231016|

---
## 🔧 Fitur Utama

- 📡 TCP Server (Rust): Menerima data JSON dari sensor
- 🧐 Penyimpanan data ke InfluxDB v2 untuk visualisasi
- 💻 GUI PyQt real-time dengan chart temperature dan humidity
- 📊 Grafana Dashboard terhubung ke InfluxDB
- 🔐 Pengiriman data ke Smart Contract Ethereum menggunakan ABI dan Web3
- 📤 Otomatisasi Pencatatan Data ke Blockchain
- 🌐 Tampilan DApp (Decentralized Application)
- 📈 Dashboard Web3 (React) dengan grafik dan fitur ekspor CSV

---
## 🚀 Cara Menjalankan Program Full Version

## 1. Buka Ubuntu & Aktifkan USB
- Masuk ke Ubuntu (jika via VM)
- Klik menu `Devices > USB > centang QinHeng Electronics HL-340`
- Buka terminal: `Ctrl + Alt + T` / VisualStudioCode

## 2. Menjalankan Node Blockchain Lokal
- Buka terminal, lalu masuk ke direktori proyek blockchain-monitoring.
- Jalankan perintah berikut untuk memulai node Hardhat lokal:
```bash
npx hardhat node
```

## 3. Deploy Smart Contract
- Buka terminal baru.
- Masuk kembali ke direktori blockchain-monitoring.
- Jalankan perintah berikut untuk men-deploy smart contract ke jaringan lokal yang sudah berjalan:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

## 4. Menjalankan Server TCP
- Buka terminal baru.
- Masuk ke direktori server TCP, yaitu rust_tcp_blockchain.
- Jalankan perintah berikut untuk memulai server:
```bash
cargo run
```

## 5. Menjalankan Modbus Client
- Buka terminal baru.
- Masuk ke direktori modbus_client.
- Jalankan perintah berikut untuk memulai klien Modbus:
```bash
cargo run
```

## 6. Memulai Simulator Sensor
- Buka terminal baru.
- Pastikan Anda berada di direktori induk proyek (bismillah_ready).
- Jalankan skrip simulator sensor dengan perintah:
```bash
python3 sensor_simulator.py
```

## 7. Mengaktifkan Lingkungan Virtual Python
- Buka terminal baru di direktori induk proyek.
- Aktifkan lingkungan virtual (.venv) dengan menjalankan perintah:
``bash
source jamur.venv/bin/activate
```

## 8. Menjalankan Aplikasi Desktop (GUI PyQt)
- Gunakan terminal yang sama dari langkah 6 (di mana lingkungan virtual sudah aktif).
- Jalankan aplikasi utama dengan perintah:
```bash
python3 main.py
```

## 9. Menampilkan Dasbor Web3
- Buka terminal baru.
- Masuk ke direktori aplikasi frontend dengan perintah: cd blockchain-monitoring/frontend-dapp.
- Jalankan live server untuk membuka dasbor di browser Anda:
```bash
live-server
```
