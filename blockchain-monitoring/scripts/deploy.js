// deploy.js (Versi yang Benar & Otomatis)
const hre = require("hardhat");
const fs = require("fs"); // Modul 'File System' dari Node.js untuk menulis file
const path = require("path"); // Modul 'Path' untuk membantu mengelola path direktori

async function main() {
    console.log("🚀 Memulai proses deployment otomatis...");

    // 1. Deploy kontrak "Monitoring"
    const Monitoring = await hre.ethers.getContractFactory("Monitoring");
    const monitoring = await Monitoring.deploy();
    await monitoring.waitForDeployment();
    
    const contractAddress = await monitoring.getAddress();
    console.log(`✅ Kontrak "Monitoring" berhasil di-deploy ke alamat: ${contractAddress}`);

    // 2. Ambil ABI
    const abi = hre.artifacts.readArtifactSync("Monitoring").abi;
    
    console.log("⚙️  Membuat file konfigurasi untuk frontend...");

    // 3. Tentukan path ke folder frontend Anda
    const frontendConfigDir = path.join(__dirname, "..", "frontend-dapp");
    const frontendConfigFile = path.join(frontendConfigDir, "config.js");
    
    // 4. Buat konten untuk file config.js
    const frontendConfigContent = `
// FILE INI DIBUAT SECARA OTOMATIS OLEH deploy.js
// JANGAN DIEDIT SECARA MANUAL

const contractAddress = "${contractAddress}";
const contractABI = ${JSON.stringify(abi, null, 2)};
    `;

    // 5. Tulis file konfigurasi
    fs.writeFileSync(frontendConfigFile, frontendConfigContent);
    console.log(`👍 File konfigurasi frontend berhasil dibuat di: ${frontendConfigFile}`);

    console.log("\n🎉 Proses Selesai! Frontend Anda sekarang sudah sinkron.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
