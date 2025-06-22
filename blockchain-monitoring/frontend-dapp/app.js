// app.js untuk Dashboard Monitoring Jamur (Polling Otomatis & Ekspor)

document.addEventListener('DOMContentLoaded', () => {
    // Variabel Global
    let web3, contract, userAccount, sensorChart;
    let allReadings = []; // Variabel untuk menyimpan semua data yang sudah diambil

    // Elemen DOM
    const connectButton = document.getElementById('connectButton');
    const statusEl = document.getElementById('status');
    const mainContentEl = document.getElementById('main-content');
    const refreshAllButton = document.getElementById('refreshAllButton');
    const exportButton = document.getElementById('exportButton');
    const latestDataEl = document.getElementById('latestFromBlockchain');
    const contractAddressInfoEl = document.getElementById('contractAddressInfo');

    function init() {
        if (typeof contractAddress === 'undefined' || typeof contractABI === 'undefined') {
            alert("Error Kritis: File 'config.js' tidak ditemukan.\n\nPastikan Anda sudah menjalankan:\nnpx hardhat run scripts/deploy.js --network localhost");
            connectButton.disabled = true;
            connectButton.innerText = "Konfigurasi Error";
            return;
        }
        
        contractAddressInfoEl.innerText = `Menggunakan Kontrak: ${contractAddress}`;
        initChart();
        connectButton.addEventListener('click', connectWallet);
        refreshAllButton.addEventListener('click', refreshAllData);
        exportButton.addEventListener('click', exportToExcel);
    }

    async function connectWallet() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                statusEl.innerText = "Menunggu izin dari MetaMask...";
                const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
                userAccount = accounts[0];
                statusEl.innerText = `🟢 Terhubung sebagai: ${userAccount.substring(0, 6)}...${userAccount.substring(userAccount.length - 4)}`;
                mainContentEl.classList.remove('hidden');
                connectButton.parentElement.classList.add('hidden'); // Sembunyikan div connection-status

                web3 = new Web3(window.ethereum);
                contract = new web3.eth.Contract(contractABI, contractAddress);
                
                await refreshAllData();
                setInterval(refreshAllData, 10000); 

            } catch (error) {
                statusEl.innerText = `🔴 Gagal terhubung: ${error.message}`;
            }
        } else {
            alert("Metamask tidak ditemukan.");
        }
    }

    async function refreshAllData() {
        if (!contract) return;
        console.log(`[${new Date().toLocaleTimeString()}] Memperbarui data...`);
        
        try {
            const total = await contract.methods.getReadingsCount().call();
            if (total == 0) {
                latestDataEl.innerText = "Kontrak ini kosong (tidak ada data).";
                allReadings = [];
                // Reset grafik jika kosong
                sensorChart.data.labels = [];
                sensorChart.data.datasets[0].data = [];
                sensorChart.data.datasets[1].data = [];
                sensorChart.update();
                return;
            }

            const readingsPromises = [];
            for (let i = 0; i < total; i++) {
                readingsPromises.push(contract.methods.readings(i).call());
            }
            allReadings = await Promise.all(readingsPromises); 

            const latestReading = allReadings[allReadings.length - 1];
            const temp = Number(latestReading.temperature) / 10.0;
            const humid = Number(latestReading.humidity) / 10.0;
            latestDataEl.innerText = `Lokasi: ${latestReading.location} | Suhu: ${temp.toFixed(1)}°C | Kelembaban: ${humid.toFixed(1)}%`;
            
            sensorChart.data.labels = allReadings.map(r => new Date(Number(r.timestamp) * 1000).toLocaleTimeString('id-ID'));
            sensorChart.data.datasets[0].data = allReadings.map(r => Number(r.temperature) / 10.0);
            sensorChart.data.datasets[1].data = allReadings.map(r => Number(r.humidity) / 10.0);
            sensorChart.update();
            
        } catch (err) {
            console.error("Gagal refresh data:", err);
            latestDataEl.innerText = "❌ Gagal memuat data dari blockchain!";
        }
    }

    function exportToExcel() {
        if (allReadings.length === 0) {
            alert("Tidak ada data untuk diekspor!");
            return;
        }

        const headers = "ID,Waktu,Lokasi,Suhu (°C),Kelembaban (%)";
        
        const rows = allReadings.map((reading, index) => {
            const timestamp = new Date(Number(reading.timestamp) * 1000).toLocaleString('id-ID');
            const temp = (Number(reading.temperature) / 10.0).toFixed(1);
            const humid = (Number(reading.humidity) / 10.0).toFixed(1);
            return `${index},"${timestamp}","${reading.location}",${temp},${humid}`;
        });

        const csvContent = [headers, ...rows].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "data_sensor_jamur.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    function initChart() {
        const ctx = document.getElementById('sensorChart').getContext('2d');
        sensorChart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [ { label: 'Suhu (°C)', data: [], borderColor: '#e74c3c', fill: false }, { label: 'Kelembaban (%)', data: [], borderColor: '#3498db', fill: false } ] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    init();
});
