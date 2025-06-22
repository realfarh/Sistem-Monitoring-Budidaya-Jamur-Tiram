// app.js untuk Dashboard Monitoring Jamur dengan web3.js

// Variabel `contractAddress` dan `contractABI` diharapkan datang dari `config.js`
document.addEventListener('DOMContentLoaded', () => {
    // Variabel Global
    let web3;
    let contract;
    let userAccount;
    let sensorChart;

    // Elemen DOM
    const connectButton = document.getElementById('connectButton');
    const statusEl = document.getElementById('status');
    const mainContentEl = document.getElementById('main-content');
    const sendDataButton = document.getElementById('sendDataButton');
    const refreshAllButton = document.getElementById('refreshAllButton');
    const latestDataEl = document.getElementById('latestFromBlockchain');

    function init() {
        // Cek jika file config.js sudah dimuat dan variabelnya ada
        if (typeof contractAddress === 'undefined' || typeof contractABI === 'undefined') {
            alert("Error Kritis: File 'config.js' tidak ditemukan atau salah. \n\nPastikan Anda sudah menjalankan:\n npx hardhat run scripts/deploy.js --network localhost");
            connectButton.disabled = true;
            connectButton.innerText = "Konfigurasi Error";
            return;
        }
        initChart();
        connectButton.addEventListener('click', connectWallet);
        sendDataButton.addEventListener('click', sendDataToBlockchain);
        refreshAllButton.addEventListener('click', refreshAllData);
    }

    async function connectWallet() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                statusEl.innerText = "Menunggu izin dari MetaMask...";
                const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
                userAccount = accounts[0];
                statusEl.innerText = `🟢 Terhubung sebagai: ${userAccount.substring(0, 6)}...${userAccount.substring(userAccount.length - 4)}`;
                mainContentEl.classList.remove('hidden');
                connectButton.style.display = 'none';

                web3 = new Web3(window.ethereum);
                contract = new web3.eth.Contract(contractABI, contractAddress);
                
                // Ambil data terakhir setelah terhubung
                getLastReading();

            } catch (error) {
                statusEl.innerText = `🔴 Gagal terhubung: ${error.message}`;
                console.error("Metamask error:", error);
            }
        } else {
            alert("Metamask tidak ditemukan. Silakan install ekstensi MetaMask.");
        }
    }

    async function sendDataToBlockchain() {
        if (!contract || !userAccount) {
            alert("Hubungkan wallet MetaMask terlebih dahulu.");
            return;
        }

        const location = document.getElementById('location').value;
        const temperature = parseInt(document.getElementById('temperature').value, 10);
        const humidity = parseInt(document.getElementById('humidity').value, 10);

        if (!location || isNaN(temperature) || isNaN(humidity)) {
            alert("Masukkan semua data sensor dengan benar!");
            return;
        }
        
        statusEl.innerText = '⏳ Mengirim transaksi ke blockchain...';
        try {
            // Gunakan fungsi "addReading" dari smart contract Anda
            await contract.methods.addReading(location, temperature, humidity).send({ from: userAccount });
            statusEl.innerText = '✅ Data berhasil dicatat ke blockchain!';
            console.log("Data berhasil disimpan ke blockchain");
            
            // Perbarui tampilan dengan data terakhir
            getLastReading();
            // Muat ulang grafik untuk menampilkan titik baru
            refreshAllData();
        } catch (error) {
            statusEl.innerText = '🔴 Gagal mengirim transaksi.';
            console.error("Gagal menyimpan ke blockchain:", error);
        }
    }

    async function getLastReading() {
        if (!contract) return;
        try {
            // Menggunakan "getReadingsCount" dan "readings" dari kontrak Anda
            const total = await contract.methods.getReadingsCount().call();
            if (total == 0) {
                latestDataEl.innerText = "Belum ada data di blockchain.";
                return;
            }
            const latestIndex = total - 1;
            const reading = await contract.methods.readings(latestIndex).call();
            
            latestDataEl.innerText = `Lokasi: ${reading.location} | Suhu: ${reading.temperature}°C | Kelembaban: ${reading.humidity}%`;
        } catch (err) {
            console.error("Gagal ambil data terakhir:", err);
            latestDataEl.innerText = "Gagal mengambil data terakhir.";
        }
    }

    async function refreshAllData() {
        if (!contract) return;
        statusEl.innerText = '⏳ Memuat semua data...';
        try {
            const total = await contract.methods.getReadingsCount().call();
            
            // Reset grafik
            sensorChart.data.labels = [];
            sensorChart.data.datasets[0].data = [];
            sensorChart.data.datasets[1].data = [];

            if (total == 0) {
                 statusEl.innerText = '🟢 Tidak ada data untuk ditampilkan.';
                 sensorChart.update();
                 return;
            }
            
            let allReadings = [];
            for (let i = 0; i < total; i++) {
                const reading = await contract.methods.readings(i).call();
                allReadings.push(reading);
            }

            allReadings.forEach(reading => {
                const timestamp = new Date(Number(reading.timestamp) * 1000).toLocaleTimeString('id-ID');
                sensorChart.data.labels.push(timestamp);
                sensorChart.data.datasets[0].data.push(Number(reading.temperature));
                sensorChart.data.datasets[1].data.push(Number(reading.humidity));
            });
            
            sensorChart.update();
            statusEl.innerText = `🟢 Berhasil memuat ${total} data.`;
        } catch (err) {
            console.error("Gagal refresh semua data:", err);
            statusEl.innerText = "❌ Gagal memuat data dari blockchain!";
        }
    }

    function initChart() {
        const ctx = document.getElementById('sensorChart').getContext('2d');
        sensorChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    { label: 'Suhu (°C)', data: [], borderColor: '#e74c3c', fill: false, tension: 0.1 },
                    { label: 'Kelembaban (%)', data: [], borderColor: '#3498db', fill: false, tension: 0.1 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    init();
});
