# Industrial Sensor Monitoring System (SHT20 + InfluxDB + Grafana + Qt GUI)
## DASHBOARD
![alt text](https://github.com/atok99/SHT20-Modbus-RTU-Integration-with-InfluxDB-Grafana-and-Qt-Designer/blob/main/QT_Dashboard.png?raw=true)

---
## SENSOR DATA ( .xlsx )
![alt text](https://github.com/atok99/SHT20-Modbus-RTU-Integration-with-InfluxDB-Grafana-and-Qt-Designer/blob/main/QT_Data.png?raw=true)

---

A Rust-based system for monitoring industrial SHT20 temperature/humidity sensors via Modbus RTU, storing data in InfluxDB, visualizing with Grafana, and controlling via a Qt desktop application.

---
## Authors
1. Rizal Khoirul Atok (2042231013)
2. Muhammad Emir Hakim Z. (2042231069)
3.  Daffa Naufal Wahyuaji (2042231081)
4. Ahmad Radhy (Supervisor)

Teknik Instrumentasi - Institut Teknologi Sepuluh Nopember

---
## Features

- **Modbus RTU Client**: Reads temperature/humidity from SHT20 sensors
- **TCP Server**: Receives and processes sensor data
- **Time-Series Database**: Stores metrics in InfluxDB
- **Visualization**: Real-time Grafana dashboards
- **Desktop GUI**: Qt application for monitoring and control
---
## System Components

| Component               | Technology Stack           |
|-------------------------|----------------------------|
| Modbus Client           | Rust (tokio-modbus)        |
| TCP Server              | Rust (tokio, serde_json)   |
| Database                | InfluxDB 2.x               |
| Visualization           | Grafana                    |
| Desktop GUI             | Qt 5/6 (QML or Widgets)    |

---
## Prerequisites

- Rust 1.70+
- InfluxDB 2.x
- Grafana 9+
- Qt 5/6 (for GUI application)
- SHT20 sensor with Modbus RTU interface
- (Optional) RS-485 to USB converter

---
## Installation

### 1. System Requirements
- Linux-based OS (recommended Ubuntu 22.04)
- 4GB RAM minimum
- USB port for RS-485 adapter
- Python 3.8+ (for optional scripts)

### 2. Install Dependencies

#### Rust Toolchain
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup default stable
```
#### Docker and Docker Compose
```bash
#For Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo usermod -aG docker $USER
newgrp docker
```

#### Qt Development Environment
```bash
#For Ubuntu/Debian
sudo apt-get install qtbase5-dev qt5-qmake qtchooser qttools5-dev-tools
```
#### System Libraries
```bash
sudo apt-get install libssl-dev pkg-config libmodbus-dev
```
### 3. Database Setup
```bash
#Start InfluxDB & Grafana
docker-compose up -d

#Create InfluxDB bucket (run in InfluxDB container)
docker exec -it influxdb influx bucket create \
  -n fermentation_data \
  -o your-org \
  --retention 0
```
### 4. Configure Environment
```bash
git clone https://github.com/atok99/SHT20-Modbus-RTU-Integration-with-InfluxDB-Grafana-and-Qt-Designer.git
cd industrial-sensor-monitoring
cp .env.example .env
```
### 5. Build Components
#### TCP Server
```bash
cd server
cargo build --release
```
![alt text](https://github.com/atok99/SHT20-Modbus-RTU-Integration-with-InfluxDB-Grafana-and-Qt-Designer/blob/main/tcp_server.png?raw=true)
#### Modbus Client
```bash
cd ../client
cargo build --release
```
![alt text](https://github.com/atok99/SHT20-Modbus-RTU-Integration-with-InfluxDB-Grafana-and-Qt-Designer/blob/main/modbus_client.png?raw=true)
#### Qt GUI
```bash
cd ../gui
qmake CONFIG+=release
make
```
### 6. Hardware Setup
1. Connect SHT20 sensor via RS-485 adapter
2. Identify device path:
```bash
dmesg | grep ttyUSB
```
4.  Set permissions:
```bash
sudo chmod 666 /dev/ttyUSB0
```
### 7. RUN System
#### Access Grafana at http://localhost:3000 (admin/admin)
![alt text](https://github.com/atok99/SHT20-Modbus-RTU-Integration-with-InfluxDB-Grafana-and-Qt-Designer/blob/main/grafana.png?raw=true)

#### Access InfluxDB at http://localhost:8086

![alt text](https://github.com/atok99/SHT20-Modbus-RTU-Integration-with-InfluxDB-Grafana-and-Qt-Designer/blob/main/InfluxDB.png?raw=true)

---
## Troubleshooting
### Sensor Connection Issues:
- Verify RS-485 device permissions
- Check Modbus slave address matches sensor configuration

### Data Not in InfluxDB:
- Confirm InfluxDB credentials in .env
- Check TCP server logs for write errors

### GUI Not Updating:
- Verify TCP server is running on correct IP:port
- Check network connectivity between components

### Contributing
Contributions welcome! Please follow:
- Fork the repository
- Create feature branch (git checkout -b feature/your-feature)
- Commit changes (git commit -am 'Add some feature')
- Push branch (git push origin feature/your-feature)
- Open Pull Request

---
## License

---




