import sys
from PyQt5.QtWidgets import QApplication, QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel, QGridLayout, QFrame
from PyQt5.QtGui import QFont, QPixmap
from PyQt5.QtCore import Qt, QTimer
import pyqtgraph as pg
from influxdb_client import InfluxDBClient
from datetime import datetime
import pandas as pd

# --- BARU: Kelas khusus untuk menampilkan waktu di sumbu X ---
class TimeAxisItem(pg.AxisItem):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.setLabel(text='Waktu', units=None)
        self.enableAutoSIPrefix(False)

    def tickStrings(self, values, scale, spacing):
        # Mengonversi timestamp (float) menjadi format string HH:mm:ss
        return [datetime.fromtimestamp(value).strftime('%H:%M:%S') for value in values]

class InfluxMonitor(QWidget):
    def __init__(self):
        super().__init__()
        # Inisialisasi data terlebih dahulu
        self.last_temp = "N/A"
        self.last_humidity = "N/A"
        self.status_text = "Idle"
        self.status_color = "grey"
        
        self.initUI()
        self.connectInfluxDB()
        
        # BARU: Timer untuk refresh otomatis setiap 5 detik
        self.auto_refresh_timer = QTimer(self)
        self.auto_refresh_timer.timeout.connect(self.loadData)
        self.auto_refresh_timer.start(5000) # 5000 ms = 5 detik
        
        self.loadData() # Muat data pertama kali saat aplikasi dimulai

    def initUI(self):
        self.setWindowTitle("Dashboard Monitoring Jamur Tiram")
        self.setGeometry(100, 100, 900, 700) # Ubah ukuran window jika perlu
        
        # Atur warna latar belakang utama
        self.setStyleSheet("background-color: #f0f0f0;")

        layout = QVBoxLayout()
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(20)

        # --- BARU: Membuat Header Panel Atas yang Menarik ---
        header_frame = QFrame()
        header_frame.setLayout(QHBoxLayout())
        header_frame.layout().setContentsMargins(0,0,0,0)
        header_frame.layout().setSpacing(20)

        # Panel Suhu
        self.temp_panel = self.create_info_panel(
            "Suhu Terkini", 
            self.last_temp, 
            "temperature-icon.png"
        )
        # Panel Kelembapan
        self.humidity_panel = self.create_info_panel(
            "Kelembapan Terkini", 
            self.last_humidity, 
            "humidity-icon.png"
        )
        # Panel Status
        self.status_panel = self.create_status_panel("Status", self.status_text)

        header_frame.layout().addWidget(self.temp_panel)
        header_frame.layout().addWidget(self.humidity_panel)
        header_frame.layout().addWidget(self.status_panel)

        layout.addWidget(header_frame)

        # --- Grafik ---
        # UBAH: Gunakan TimeAxisItem untuk sumbu 'bottom' (X)
        axis_items = {'bottom': TimeAxisItem(orientation='bottom')}
        self.graphWidget = pg.PlotWidget(axisItems=axis_items)
        self.graphWidget.setBackground('w')
        self.graphWidget.addLegend()
        self.graphWidget.showGrid(x=True, y=True)
        self.graphWidget.getPlotItem().getAxis('left').setLabel('Nilai Sensor')
        self.graphWidget.setTitle("Grafik Sensor Real-Time", color='#444', size='16pt')

        self.temp_plot = self.graphWidget.plot(name="Suhu (°C)", pen=pg.mkPen('#d62728', width=2)) # Warna merah
        self.humidity_plot = self.graphWidget.plot(name="Kelembaban (%)", pen=pg.mkPen('#1f77b4', width=2)) # Warna biru
        
        layout.addWidget(self.graphWidget)
        self.setLayout(layout)

    # --- BARU: Fungsi untuk membuat panel info yang stylish ---
    def create_info_panel(self, title_text, value_text, icon_path):
        panel = QFrame()
        panel.setStyleSheet("""
            QFrame {
                background-color: white;
                border-radius: 8px;
            }
        """)
        panel.setFrameShape(QFrame.StyledPanel)
        panel_layout = QHBoxLayout(panel)
        panel_layout.setContentsMargins(15, 15, 15, 15)

        icon_label = QLabel()
        pixmap = QPixmap(icon_path)
        if not pixmap.isNull():
             icon_label.setPixmap(pixmap.scaled(48, 48, Qt.KeepAspectRatio, Qt.SmoothTransformation))
        panel_layout.addWidget(icon_label)

        text_layout = QVBoxLayout()
        text_layout.setSpacing(0)
        
        title_label = QLabel(title_text)
        title_label.setFont(QFont('Segoe UI', 10))
        title_label.setStyleSheet("color: #666;")
        
        value_label = QLabel(value_text)
        value_label.setFont(QFont('Segoe UI', 18, QFont.Bold))
        value_label.setStyleSheet("color: #333;")

        text_layout.addWidget(title_label)
        text_layout.addWidget(value_label)
        
        panel_layout.addLayout(text_layout)
        panel_layout.addStretch()

        # Simpan referensi ke value_label agar bisa diupdate
        if "Suhu" in title_text:
            self.temp_value_label = value_label
        elif "Kelembapan" in title_text:
            self.humidity_value_label = value_label

        return panel

    # --- BARU: Fungsi untuk membuat panel status ---
    def create_status_panel(self, title_text, status_text):
        panel = QFrame()
        panel.setStyleSheet("""
            QFrame {
                background-color: white;
                border-radius: 8px;
            }
        """)
        panel.setFrameShape(QFrame.StyledPanel)
        panel_layout = QVBoxLayout(panel)
        panel_layout.setContentsMargins(15, 15, 15, 15)
        
        title_label = QLabel(title_text)
        title_label.setFont(QFont('Segoe UI', 10))
        title_label.setStyleSheet("color: #666;")

        self.status_value_label = QLabel(status_text)
        self.status_value_label.setFont(QFont('Segoe UI', 18, QFont.Bold))
        self.update_status_ui() # Atur warna awal
        
        panel_layout.addWidget(title_label)
        panel_layout.addWidget(self.status_value_label)
        
        return panel

    def connectInfluxDB(self):
        # Konfigurasi tidak berubah
        self.token = "AMdJrRUmxq1PdZa4JA3CHg8QCEz3_JNxp_9dD0uFCnFrVtDOJnSBbSaHXrgeWMIW_0QIbzl2aisMXPZXWaEmGA=="
        self.org = "Jamur"
        self.bucket = "Tiram2"
        self.url = "http://localhost:8086"
        try:
            self.client = InfluxDBClient(url=self.url, token=self.token, org=self.org)
            self.query_api = self.client.query_api()
            self.status_text = "Terhubung"
            self.status_color = "#2ecc71" # Warna hijau
        except Exception as e:
            self.status_text = "Gagal"
            self.status_color = "#e74c3c" # Warna merah
            print(f"Gagal terhubung ke InfluxDB: {e}")
        self.update_status_ui()

    def loadData(self):
        query = f'''
        from(bucket: "{self.bucket}")
          |> range(start: -1h) 
          |> filter(fn: (r) => r._measurement == "environment_monitoring")
          |> filter(fn: (r) => r._field == "temperature_celsius" or r._field == "humidity_percent")
          |> filter(fn: (r) => r["location"] == "Produksi Jamur")
          |> filter(fn: (r) => r["process_stage"] == "Jamur tiram")
          |> filter(fn: (r) => r["sensor_id"] == "SHT20-PascaPanen-001")
        '''

        try:
            result_df = self.query_api.query_data_frame(query)

            if result_df.empty:
                self.status_text = "Menunggu Data"
                self.status_color = "#f39c12" # Warna oranye
                self.update_status_ui()
                return

            self.status_text = "Monitoring"
            self.status_color = "#3498db" # Warna biru
            
            # Proses data Suhu
            temp_df = result_df[result_df['_field'] == 'temperature_celsius']
            if not temp_df.empty:
                temp_times = pd.to_datetime(temp_df['_time']).astype(int) / 10**9
                temp_values = temp_df['_value']
                self.temp_plot.setData(x=temp_times.to_numpy(), y=temp_values.to_numpy())
                self.last_temp = f"{temp_values.iloc[-1]:.1f} °C"
            else:
                 self.temp_plot.setData([], [])

            # Proses data Kelembapan
            hum_df = result_df[result_df['_field'] == 'humidity_percent']
            if not hum_df.empty:
                hum_times = pd.to_datetime(hum_df['_time']).astype(int) / 10**9
                hum_values = hum_df['_value']
                self.humidity_plot.setData(x=hum_times.to_numpy(), y=hum_values.to_numpy())
                self.last_humidity = f"{hum_values.iloc[-1]:.1f} %"
            else:
                self.humidity_plot.setData([], [])
            
            self.update_ui_values()

        except Exception as e:
            self.status_text = "Error Query"
            self.status_color = "#e74c3c" # Warna merah
            print(f"Gagal mengambil data: {e}")
        
        self.update_status_ui()

    # --- BARU: Fungsi untuk update teks di panel atas ---
    def update_ui_values(self):
        self.temp_value_label.setText(self.last_temp)
        self.humidity_value_label.setText(self.last_humidity)

    # --- BARU: Fungsi untuk update teks dan warna status ---
    def update_status_ui(self):
        if hasattr(self, 'status_value_label'):
            self.status_value_label.setText(self.status_text)
            self.status_value_label.setStyleSheet(f"color: {self.status_color}; font-size: 18pt; font-weight: bold;")


if __name__ == '__main__':
    app = QApplication(sys.argv)
    window = InfluxMonitor()
    window.show()
    sys.exit(app.exec_())