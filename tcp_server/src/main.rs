use influxdb2::Client;
use influxdb2::models::DataPoint;
use serde::Deserialize;
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::TcpListener,
};
use futures::stream;
use chrono::{Utc, DateTime};

#[derive(Debug, Deserialize)]
struct SensorData {
    timestamp: String,           // Required timestamp in ISO 8601 format
    sensor_id: String,           // Required sensor identifier
    location: String,            // Required location
    process_stage: String,       // Required process stage
    temperature_celsius: f64,    // Temperature field with explicit unit
    humidity_percent: f64,       // Humidity field with explicit unit
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Configure InfluxDB connection
    let influx_url = "http://localhost:8086";
    let influx_org = "Jamur";
    let influx_token = "AMdJrRUmxq1PdZa4JA3CHg8QCEz3_JNxp_9dD0uFCnFrVtDOJnSBbSaHXrgeWMIW_0QIbzl2aisMXPZXWaEmGA==";
    let influx_bucket = "Tiram2";

    let client = Client::new(influx_url, influx_org, influx_token);

    // Verify InfluxDB connection
    match client.health().await {
        Ok(health) => println!("InfluxDB connection healthy: {:?}", health),
        Err(e) => {
            eprintln!("Failed to connect to InfluxDB: {}", e);
            return Err(e.into());
        }
    }

    let listener = TcpListener::bind("127.0.0.1:7878").await?;
    println!("Server running on 127.0.0.1:7878");

    loop {
        let (mut socket, _) = listener.accept().await?;
        let client = client.clone();
        let bucket = influx_bucket.to_string();
        
        tokio::spawn(async move {
            let mut buf = [0; 1024];
            
            match socket.read(&mut buf).await {
                Ok(n) if n == 0 => return,
                Ok(n) => {
                    let data = match std::str::from_utf8(&buf[..n]) {
                        Ok(d) => d,
                        Err(e) => {
                            eprintln!("Error parsing data: {}", e);
                            let _ = socket.write_all(b"ERROR: Invalid UTF-8 data").await;
                            return;
                        }
                    };
                    
                    println!("Received raw data: {}", data);
                    
                    match serde_json::from_str::<SensorData>(data) {
                        Ok(sensor_data) => {
                            println!("Data received: {:?}", sensor_data);
                            
                            // Parse the timestamp string into DateTime
                            let timestamp = match DateTime::parse_from_rfc3339(&sensor_data.timestamp) {
                                Ok(dt) => dt.with_timezone(&Utc),
                                Err(e) => {
                                    eprintln!("Invalid timestamp format: {}", e);
                                    let _ = socket.write_all(b"ERROR: Invalid timestamp format").await;
                                    return;
                                }
                            };

                            // Konversi timestamp ke nanoseconds
                            let timestamp_ns = timestamp.timestamp_nanos_opt().unwrap_or_else(|| {
                                eprintln!("Warning: Timestamp conversion failed, using 0 as fallback");
                                0
                            });

                            // Create data point with all fields
                            let point = DataPoint::builder("environment_monitoring")
                                .tag("sensor_id", &sensor_data.sensor_id)
                                .tag("location", &sensor_data.location)
                                .tag("process_stage", &sensor_data.process_stage)
                                .field("temperature_celsius", sensor_data.temperature_celsius)
                                .field("humidity_percent", sensor_data.humidity_percent)
                                .timestamp(timestamp_ns)  // Now passing i64
                                .build()
                                .unwrap();
                            
                            // Write to InfluxDB
                            match client.write(&bucket, stream::iter(vec![point])).await {
                                Ok(_) => {
                                    println!("Data successfully written to InfluxDB");
                                    let _ = socket.write_all(b"OK").await;
                                },
                                Err(e) => {
                                    eprintln!("Failed to write to InfluxDB: {}", e);
                                    let _ = socket.write_all(
                                        format!("ERROR: Database write failed - {}", e).as_bytes()
                                    ).await;
                                }
                            }
                        }
                        Err(e) => {
                            eprintln!("Error parsing JSON: {}", e);
                            let _ = socket.write_all(
                                format!("ERROR: Invalid JSON - {}", e).as_bytes()
                            ).await;
                        }
                    }
                }
                Err(e) => eprintln!("Error reading socket: {}", e),
            }
        });
    }
}