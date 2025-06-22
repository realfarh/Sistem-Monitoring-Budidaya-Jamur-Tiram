// sistem_fermentasi/crates/tcp-server/src/main.rs

// BARU: Imports untuk ethers, dotenv, dan env
use ethers::prelude::*;
use std::env;
use dotenv::dotenv;

use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, BufReader};
use serde::Deserialize;
use influxdb2::Client as InfluxClient;
use influxdb2::models::DataPoint;
use std::sync::Arc;
use std::error::Error;
use chrono::{DateTime, Utc};

// BARU: Generate Rust binding dari file ABI
abigen!(
    SensorRegistry,
    "./abi/Monitoring.json",
    event_derives(serde::Deserialize, serde::Serialize)
);

// Struct data yang diterima (tidak berubah)
#[derive(Deserialize, Debug, Clone)]
struct SensorData {
    timestamp: String,
    sensor_id: String,
    location: String,
    process_stage: String,
    temperature_celsius: f64,
    humidity_percent: f64,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // BARU: Muat variabel dari file .env
    dotenv().ok();

    // --- Konfigurasi InfluxDB (Tidak berubah) ---
    let influx_url = "http://localhost:8086";
    let influx_org = "Jamur";
    let influx_bucket = "Tiram2";
    let influx_token = "AMdJrRUmxq1PdZa4JA3CHg8QCEz3_JNxp_9dD0uFCnFrVtDOJnSBbSaHXrgeWMIW_0QIbzl2aisMXPZXWaEmGA==";
    let influx_client = Arc::new(InfluxClient::new(influx_url, influx_org, influx_token));

    // --- BARU: Konfigurasi dan inisialisasi koneksi Blockchain ---
    let rpc_url = env::var("RPC_URL").expect("RPC_URL harus diset");
    let private_key = env::var("PRIVATE_KEY").expect("PRIVATE_KEY harus diset");
    let contract_address = env::var("CONTRACT_ADDRESS").expect("CONTRACT_ADDRESS harus diset");

    let provider = Provider::<Http>::try_from(rpc_url)?;
    let wallet: LocalWallet = private_key.parse::<LocalWallet>()?.with_chain_id(31337u64);
    let eth_client = SignerMiddleware::new(provider, wallet.clone());
    let contract = SensorRegistry::new(contract_address.parse::<Address>()?, Arc::new(eth_client));
    
    // BARU: Bungkus kontrak dalam Arc agar bisa di-share antar thread
    let contract_arc = Arc::new(contract);
    println!("✅ [Blockchain] Terhubung ke smart contract di alamat: {}", contract_address);
    
    // --- Inisialisasi TCP Server (Tidak berubah) ---
    let addr = "127.0.0.1:7878";
    let listener = TcpListener::bind(&addr).await.unwrap();
    println!("✅ [Server] Berjalan pada {}, siap menerima data...", addr);

    loop {
        let (socket, _) = listener.accept().await.unwrap();
        // UBAH: Clone Arc untuk InfluxDB dan Blockchain
        let influx_clone = Arc::clone(&influx_client);
        let contract_clone = Arc::clone(&contract_arc);
        let bucket_clone = influx_bucket.to_string();

        tokio::spawn(async move {
            // UBAH: Kirim kedua clone ke handle_connection
            if let Err(e) = handle_connection(socket, influx_clone, contract_clone, &bucket_clone).await {
                eprintln!("🔴 [Server] Gagal memproses koneksi: {}", e);
            }
        });
    }
}

// UBAH: Tambahkan parameter `contract` ke fungsi
async fn handle_connection(
    stream: TcpStream,
    influx_client: Arc<InfluxClient>,
    contract: Arc<SensorRegistry<SignerMiddleware<Provider<Http>, Wallet<k256::ecdsa::SigningKey>>>>,
    bucket: &str,
) -> Result<(), Box<dyn Error>> {
    let mut buffer = Vec::new();
    let mut reader = BufReader::new(stream);
    reader.read_to_end(&mut buffer).await?;
    
    let data: SensorData = serde_json::from_slice(&buffer)?;
    println!("📥 [Server] Data diterima: {:?}", data);

    // --- Bagian 1: Simpan ke InfluxDB (Tidak berubah) ---
    tokio::spawn({
        let data_clone = data.clone();
        let influx_client_clone = Arc::clone(&influx_client);
        let bucket_clone = bucket.to_string();
        async move {
            if let Err(e) = save_to_influxdb(&data_clone, influx_client_clone, &bucket_clone).await {
                eprintln!("🔴 [InfluxDB] Gagal menyimpan data: {}", e);
            }
        }
    });

    // --- BARU: Bagian 2: Kirim Transaksi ke Blockchain ---
    println!("📨 [Blockchain] Mempersiapkan transaksi...");

    // Konversi tipe data untuk smart contract
    // <<< DIUBAH: Baris ini dihapus karena Smart Contract tidak meminta timestamp.
    // let timestamp_onchain = U256::from_dec_str(&data.timestamp.parse::<DateTime<Utc>>()?.timestamp().to_string())?;
    
    let location_onchain = data.location.clone();
    // Kita kalikan 10 untuk menyimpan 1 angka desimal sebagai integer
    let temperature_onchain = I256::from((data.temperature_celsius * 10.0) as i64);
    let humidity_onchain = U256::from((data.humidity_percent * 10.0) as u64);
    
    // <<< DIUBAH: Pemanggilan fungsi disesuaikan agar hanya mengirim 3 argumen
    // sesuai urutan di file Monitoring.sol (location, temperature, humidity).
    let tx = contract.add_reading(
        location_onchain, 
        temperature_onchain, 
        humidity_onchain
    ).send().await?.await?;

    println!("✅ [Blockchain] Data berhasil dicatat! Hash: {:?}", tx.unwrap().transaction_hash);

    Ok(())
}

// BARU: Fungsi terpisah untuk menyimpan ke InfluxDB agar lebih rapi
async fn save_to_influxdb(data: &SensorData, client: Arc<InfluxClient>, bucket: &str) -> Result<(), Box<dyn Error>> {
    let timestamp = data.timestamp.parse::<DateTime<Utc>>()?;

    let point = DataPoint::builder("environment_monitoring")
        .tag("sensor_id", data.sensor_id.clone())
        .tag("location", data.location.clone())
        .tag("process_stage", data.process_stage.clone())
        .field("temperature_celsius", data.temperature_celsius)
        .field("humidity_percent", data.humidity_percent)
        .timestamp(timestamp.timestamp_nanos_opt().unwrap_or_default())
        .build()?;

    client.write(bucket, futures::stream::iter(vec![point])).await?;
    println!("💾 [InfluxDB] Data berhasil disimpan.");
    Ok(())
}