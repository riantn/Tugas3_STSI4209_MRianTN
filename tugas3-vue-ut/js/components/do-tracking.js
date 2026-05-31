// DO Tracking Component
Vue.component('do-tracking', {
  props: {
    data: {
      type: Array,
      required: true
    },
    paketList: {
      type: Array,
      default: () => []
    },
    ekspedisiList: {
      type: Array,
      default: () => ['JNE Regular', 'JNE Express']
    }
  },
  data() {
    return {
      searchTerm: '',
      searchType: 'all', // all, nodo, nim
      showAddForm: false,
      showDetailModal: false,
      selectedDO: null,
      newProgress: {
        keterangan: ''
      },
      
      // New DO Form
      newDO: {
        noDO: '',
        nim: '',
        nama: '',
        ekspedisi: 'JNE Regular',
        paketId: '',
        tanggalKirim: '',
        totalHarga: 0
      },
      selectedPaketDetail: null
    };
  },
  computed: {
    filteredData() {
      if (!this.searchTerm) return this.data;
      
      const term = this.searchTerm.toLowerCase().trim();
      
      return this.data.filter(item => {
        const noDOMatch = item.noDO.toLowerCase().includes(term);
        const nimMatch = item.nim.toLowerCase().includes(term);
        const namaMatch = item.nama.toLowerCase().includes(term);
        
        if (this.searchType === 'nodo') return noDOMatch;
        if (this.searchType === 'nim') return nimMatch;
        return noDOMatch || nimMatch || namaMatch;
      });
    },
    
    currentYear() {
      return new Date().getFullYear();
    }
  },
  watch: {
    // Watcher 1: Auto generate DO number when form opens
    showAddForm(newVal) {
      if (newVal) {
        this.generateDONumber();
        // Set default date to today
        const today = new Date();
        this.newDO.tanggalKirim = today.toISOString().split('T')[0];
      }
    },
    
    // Watcher 2: Update total harga when paket selected
    'newDO.paketId'(newId) {
      if (newId) {
        const paket = this.paketList.find(p => p.id == newId);
        if (paket) {
          this.newDO.totalHarga = paket.harga;
          this.selectedPaketDetail = paket;
        }
      } else {
        this.selectedPaketDetail = null;
        this.newDO.totalHarga = 0;
      }
    }
  },
  methods: {
    formatRupiah(amount) {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount || 0);
    },
    
    formatTanggal(dateStr) {
      if (!dateStr) return '-';
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    },
    
    getCurrentStatus(item) {
      if (!item.statusHistory || item.statusHistory.length === 0) {
        return { text: 'Baru Dibuat', color: '#64748b' };
      }
      const last = item.statusHistory[item.statusHistory.length - 1];
      return { 
        text: last.keterangan.length > 40 ? last.keterangan.substring(0, 40) + '...' : last.keterangan, 
        color: '#1e40af' 
      };
    },
    
    generateDONumber() {
      const nextNum = ApiService.generateNextDONumber(this.data);
      this.newDO.noDO = nextNum;
    },
    
    openAddForm() {
      this.newDO = {
        noDO: '',
        nim: '',
        nama: '',
        ekspedisi: 'JNE Regular',
        paketId: '',
        tanggalKirim: '',
        totalHarga: 0
      };
      this.selectedPaketDetail = null;
      this.showAddForm = true;
    },
    
    saveNewDO() {
      // Validation
      if (!this.newDO.nim || !this.newDO.nama || !this.newDO.paketId || !this.newDO.tanggalKirim) {
        alert('Harap isi NIM, Nama, Paket, dan Tanggal Kirim!');
        return;
      }
      
      const paket = this.paketList.find(p => p.id == this.newDO.paketId);
      if (!paket) {
        alert('Paket tidak valid!');
        return;
      }
      
      const newTrackingItem = {
        noDO: this.newDO.noDO,
        nim: this.newDO.nim,
        nama: this.newDO.nama,
        ekspedisi: this.newDO.ekspedisi,
        paket: {
          kodePaket: paket.kodePaket,
          namaPaket: paket.namaPaket,
          harga: paket.harga
        },
        tanggalKirim: this.newDO.tanggalKirim,
        totalHarga: paket.harga,
        statusHistory: [
          {
            waktu: new Date().toLocaleString('id-ID'),
            keterangan: 'Delivery Order baru dibuat dan diproses'
          }
        ]
      };
      
      // Emit the created DO and let the parent update the shared tracking list.
      this.$emit('created', newTrackingItem);
      
      this.showAddForm = false;
      alert(`DO ${newTrackingItem.noDO} berhasil dibuat!`);
    },
    
    viewDetail(item) {
      this.selectedDO = JSON.parse(JSON.stringify(item)); // deep copy
      this.newProgress.keterangan = '';
      this.showDetailModal = true;
    },
    
    addProgress() {
      if (!this.newProgress.keterangan.trim()) {
        alert('Keterangan progress tidak boleh kosong!');
        return;
      }
      
      const now = new Date();
      const waktu = now.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const progressEntry = {
        waktu: waktu,
        keterangan: this.newProgress.keterangan.trim()
      };
      
      // Find and update in main data
      const index = this.data.findIndex(d => d.noDO === this.selectedDO.noDO);
      if (index !== -1) {
        if (!this.data[index].statusHistory) {
          this.data[index].statusHistory = [];
        }
        this.data[index].statusHistory.push(progressEntry);
        
        // Update selectedDO for modal
        this.selectedDO.statusHistory.push(progressEntry);
        
        this.$emit('progress-updated', this.selectedDO);
      }
      
      this.newProgress.keterangan = '';
      
      // Success feedback
      const notif = document.createElement('div');
      notif.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#16a34a;color:white;padding:12px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.2);z-index:9999;';
      notif.textContent = '✅ Progress berhasil ditambahkan!';
      document.body.appendChild(notif);
      setTimeout(() => notif.remove(), 2500);
    },
    
    // Keyboard handlers
    handleSearchKeydown(e) {
      if (e.key === 'Enter') {
        // Already reactive, but can add analytics or something
      }
      if (e.key === 'Escape') {
        this.searchTerm = '';
      }
    },
    
    clearSearch() {
      this.searchTerm = '';
    }
  },
  template: `
    <div>
      <!-- Search Bar -->
      <div class="search-bar">
        <div style="flex:1; position:relative;">
          <input 
            type="text" 
            v-model="searchTerm" 
            placeholder="Cari berdasarkan Nomor DO, NIM, atau Nama..." 
            @keydown="handleSearchKeydown"
            style="width:100%; padding-left:48px;"
          />
          <span style="position:absolute; left:18px; top:13px; color:#64748b;">🔍</span>
        </div>
        
        <select v-model="searchType" style="width:160px; padding:12px 14px; border:2px solid #e2e8f0; border-radius:9999px;">
          <option value="all">Semua Kolom</option>
          <option value="nodo">Nomor DO</option>
          <option value="nim">NIM</option>
        </select>
        
        <button class="btn btn-outline" @click="clearSearch" v-if="searchTerm">✕ Clear</button>
        <button class="btn btn-success" @click="openAddForm">➕ Buat DO Baru</button>
      </div>
      
      <div v-if="filteredData.length === 0" style="text-align:center; padding:60px 20px; color:#64748b;">
        <div style="font-size:3rem; margin-bottom:16px;">📭</div>
        <h3>Tidak ada data ditemukan</h3>
        <p>Coba ubah kata kunci pencarian atau buat DO baru.</p>
      </div>
      
      <!-- Tracking List -->
      <div class="table-container" v-else>
        <table>
          <thead>
            <tr>
              <th>Nomor DO</th>
              <th>NIM / Nama</th>
              <th>Paket</th>
              <th>Ekspedisi</th>
              <th>Tanggal Kirim</th>
              <th>Total Harga</th>
              <th>Status Terkini</th>
              <th style="width:120px;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredData" :key="item.noDO">
              <td>
                <strong style="color:#1e40af; font-family:monospace;">{{ item.noDO }}</strong>
              </td>
              <td>
                <div><strong>{{ item.nim }}</strong></div>
                <div style="color:#64748b; font-size:0.9rem;">{{ item.nama }}</div>
              </td>
              <td>
                <div><strong>{{ item.paket.namaPaket }}</strong></div>
                <div style="font-size:0.8rem; color:#64748b;">{{ item.paket.kodePaket }}</div>
              </td>
              <td>
                <span style="background:#dbeafe; color:#1e40af; padding:4px 10px; border-radius:9999px; font-size:0.85rem; font-weight:600;">
                  {{ item.ekspedisi }}
                </span>
              </td>
              <td>{{ formatTanggal(item.tanggalKirim) }}</td>
              <td><strong>{{ formatRupiah(item.totalHarga) }}</strong></td>
              <td>
                <div :style="{ color: getCurrentStatus(item).color, fontWeight: '600' }">
                  {{ getCurrentStatus(item).text }}
                </div>
                <div style="font-size:0.75rem; color:#94a3b8;">{{ item.statusHistory ? item.statusHistory.length : 0 }} update</div>
              </td>
              <td>
                <button class="btn btn-sm btn-primary" @click="viewDetail(item)">📍 Lihat & Update</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Add New DO Form -->
      <div v-if="showAddForm" class="modal show" @click.self="showAddForm=false">
        <div class="modal-content" style="max-width:620px;">
          <div class="modal-header">
            <h3>📦 Buat Delivery Order Baru</h3>
            <button @click="showAddForm=false" style="background:none;border:none;font-size:1.5rem;cursor:pointer;">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>Nomor DO (Otomatis)</label>
                <input type="text" v-model="newDO.noDO" readonly style="background:#f1f5f9; font-family:monospace; font-weight:700;" />
                <small style="color:#64748b">Format: DO{{ currentYear }}-XXX</small>
              </div>
              <div class="form-group">
                <label>Ekspedisi *</label>
                <select v-model="newDO.ekspedisi">
                  <option v-for="eks in ekspedisiList" :key="eks" :value="eks">{{ eks }}</option>
                </select>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>NIM Mahasiswa *</label>
                <input type="text" v-model="newDO.nim" placeholder="2023123456" maxlength="10" />
              </div>
              <div class="form-group">
                <label>Nama Lengkap *</label>
                <input type="text" v-model="newDO.nama" placeholder="Nama Mahasiswa" />
              </div>
            </div>
            
            <div class="form-group">
              <label>Paket Bahan Ajar *</label>
              <select v-model="newDO.paketId">
                <option value="">-- Pilih Paket --</option>
                <option v-for="paket in paketList" :key="paket.id" :value="paket.id">
                  {{ paket.kodePaket }} - {{ paket.namaPaket }}
                </option>
              </select>
            </div>
            
            <!-- Paket Detail Preview -->
            <div v-if="selectedPaketDetail" style="background:#f0f9ff; border:1px solid #bae6fd; padding:14px; border-radius:8px; margin-bottom:16px;">
              <strong style="color:#0369a1;">Detail Isi Paket:</strong>
              <ul style="margin:8px 0 0 18px; font-size:0.95rem;">
                <li v-for="(isi, idx) in selectedPaketDetail.isi" :key="idx">{{ isi }}</li>
              </ul>
              <div style="margin-top:8px; font-weight:700; color:#0e7490;">
                Total: {{ formatRupiah(selectedPaketDetail.harga) }}
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Tanggal Kirim *</label>
                <input type="date" v-model="newDO.tanggalKirim" />
                <small style="color:#64748b">Atau pilih tanggal di masa depan</small>
              </div>
              <div class="form-group">
                <label>Total Harga</label>
                <input type="text" :value="formatRupiah(newDO.totalHarga)" readonly style="background:#f8fafc; font-weight:700;" />
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showAddForm=false">Batal</button>
            <button class="btn btn-success" @click="saveNewDO">🚀 Buat & Kirim DO</button>
          </div>
        </div>
      </div>
      
      <!-- Detail & Progress Modal -->
      <div v-if="showDetailModal && selectedDO" class="modal show" @click.self="showDetailModal=false">
        <div class="modal-content" style="max-width:680px;">
          <div class="modal-header">
            <h3>📍 Detail Tracking - {{ selectedDO.noDO }}</h3>
            <button @click="showDetailModal=false" style="background:none;border:none;font-size:1.5rem;cursor:pointer;">&times;</button>
          </div>
          
          <div class="modal-body">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
              <div>
                <strong>NIM:</strong> {{ selectedDO.nim }}<br>
                <strong>Nama:</strong> {{ selectedDO.nama }}
              </div>
              <div>
                <strong>Ekspedisi:</strong> {{ selectedDO.ekspedisi }}<br>
                <strong>Tanggal Kirim:</strong> {{ formatTanggal(selectedDO.tanggalKirim) }}
              </div>
            </div>
            
            <div style="background:#f8fafc; padding:12px 16px; border-radius:8px; margin-bottom:20px;">
              <strong>Paket:</strong> {{ selectedDO.paket.namaPaket }} ({{ selectedDO.paket.kodePaket }})<br>
              <strong>Total Harga:</strong> <span style="color:#16a34a; font-weight:700;">{{ formatRupiah(selectedDO.totalHarga) }}</span>
            </div>
            
            <h4 style="margin:16px 0 10px; color:#334155;">Riwayat Perjalanan Pengiriman</h4>
            
            <div class="timeline" v-if="selectedDO.statusHistory && selectedDO.statusHistory.length > 0">
              <div class="timeline-item" v-for="(entry, index) in selectedDO.statusHistory" :key="index">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-time">{{ entry.waktu }}</div>
                  <div class="timeline-keterangan">{{ entry.keterangan }}</div>
                </div>
              </div>
            </div>
            <div v-else style="color:#64748b; font-style:italic;">Belum ada update status.</div>
            
            <!-- Add New Progress -->
            <div style="margin-top:24px; padding-top:16px; border-top:1px solid #e2e8f0;">
              <h4 style="margin-bottom:10px; color:#334155;">Tambah Update Progress</h4>
              <div style="display:flex; gap:10px;">
                <input 
                  type="text" 
                  v-model="newProgress.keterangan" 
                  placeholder="Contoh: Paket telah sampai di kantor pos setempat" 
                  style="flex:1; padding:12px 14px; border:1px solid #cbd5e1; border-radius:8px;"
                  @keydown.enter="addProgress"
                />
                <button class="btn btn-primary" @click="addProgress">+ Tambah</button>
              </div>
              <small style="color:#64748b;">Tekan Enter atau klik tombol untuk menambahkan update waktu real-time.</small>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showDetailModal=false">Tutup</button>
          </div>
        </div>
      </div>
    </div>
  `
});