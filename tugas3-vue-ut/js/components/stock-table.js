// Stock Table Component - Full featured stock management
Vue.component('ba-stock-table', {
  props: {
    items: {
      type: Array,
      required: true
    },
    upbjjList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      // Filters
      filterUpbjj: '',
      filterKategori: '',
      filterLowStock: false,
      sortBy: 'judul',
      sortOrder: 'asc',
      
      // Form for add/edit
      showForm: false,
      isEditing: false,
      currentItem: {
        id: null,
        kode: '',
        judul: '',
        kategori: '',
        upbjj: '',
        lokasiRak: '',
        harga: 0,
        qty: 0,
        safety: 0,
        catatanHTML: ''
      },
      
      // Search within table
      searchTerm: '',
      
      // Available categories (dependent)
      availableCategories: []
    };
  },
  computed: {
    // Unique categories from all items (for initial filter)
    allCategories() {
      const cats = new Set(this.items.map(item => item.kategori));
      return Array.from(cats).sort();
    },
    
    // Dependent categories based on selected UT-Daerah
    filteredCategories() {
      if (!this.filterUpbjj) {
        return this.allCategories;
      }
      const cats = new Set(
        this.items
          .filter(item => item.upbjj === this.filterUpbjj)
          .map(item => item.kategori)
      );
      return Array.from(cats).sort();
    },
    
    // Filtered, searched, and sorted items
    processedItems() {
      let result = [...this.items];
      
      // Search
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        result = result.filter(item => 
          item.judul.toLowerCase().includes(term) ||
          item.kode.toLowerCase().includes(term) ||
          item.upbjj.toLowerCase().includes(term) ||
          item.kategori.toLowerCase().includes(term)
        );
      }
      
      // Filter by UT-Daerah
      if (this.filterUpbjj) {
        result = result.filter(item => item.upbjj === this.filterUpbjj);
      }
      
      // Filter by Kategori (dependent)
      if (this.filterKategori) {
        result = result.filter(item => item.kategori === this.filterKategori);
      }
      
      // Low stock filter (qty < safety OR qty === 0)
      if (this.filterLowStock) {
        result = result.filter(item => item.qty < item.safety || item.qty === 0);
      }
      
      // Sorting
      result.sort((a, b) => {
        let valA, valB;
        
        if (this.sortBy === 'judul') {
          valA = a.judul.toLowerCase();
          valB = b.judul.toLowerCase();
          return this.sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else if (this.sortBy === 'qty') {
          valA = a.qty;
          valB = b.qty;
        } else if (this.sortBy === 'harga') {
          valA = a.harga;
          valB = b.harga;
        } else {
          valA = a[this.sortBy];
          valB = b[this.sortBy];
        }
        
        if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
      
      return result;
    },
    
    // Stats
    totalItems() {
      return this.processedItems.length;
    },
    
    lowStockCount() {
      return this.items.filter(item => item.qty < item.safety || item.qty === 0).length;
    },
    
    totalValue() {
      return this.items.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    }
  },
  watch: {
    // Watcher 1: When UT-Daerah changes, reset kategori filter and update available categories
    filterUpbjj(newVal) {
      if (newVal && this.filterKategori) {
        // Check if current kategori still valid for new upbjj
        const valid = this.items.some(item => 
          item.upbjj === newVal && item.kategori === this.filterKategori
        );
        if (!valid) {
          this.filterKategori = '';
        }
      }
      // Update available categories
      this.availableCategories = this.filteredCategories;
    },
    
    // Watcher 2: Reset kategori when low stock filter changes (example of another watcher)
    filterLowStock() {
      // Could add logic here if needed
    }
  },
  methods: {
    // Format helpers (using global or local)
    formatRupiah(amount) {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount);
    },
    
    formatQty(qty) {
      return `${qty} buah`;
    },
    
    // Open add new form
    openAddForm() {
      this.isEditing = false;
      this.currentItem = {
        id: null,
        kode: '',
        judul: '',
        kategori: '',
        upbjj: this.filterUpbjj || (this.upbjjList.length > 0 ? this.upbjjList[0] : ''),
        lokasiRak: '',
        harga: 100000,
        qty: 10,
        safety: 5,
        catatanHTML: ''
      };
      this.showForm = true;
    },
    
    // Open edit form
    openEditForm(item) {
      this.isEditing = true;
      this.currentItem = { ...item };
      this.showForm = true;
    },
    
    // Save (create or update)
    saveItem() {
      // Simple validation
      if (!this.currentItem.kode || !this.currentItem.judul || !this.currentItem.kategori || 
          !this.currentItem.upbjj || this.currentItem.harga <= 0 || this.currentItem.qty < 0 || this.currentItem.safety < 0) {
        alert('Harap isi semua field wajib dengan benar!');
        return;
      }
      
      if (this.isEditing) {
        // Update existing
        const index = this.items.findIndex(i => i.id === this.currentItem.id);
        if (index !== -1) {
          this.$set(this.items, index, { ...this.currentItem });
          this.$emit('updated', this.currentItem);
        }
      } else {
        // Create new
        const newId = Math.max(0, ...this.items.map(i => i.id)) + 1;
        const newItem = { ...this.currentItem, id: newId };
        this.items.push(newItem);
        this.$emit('created', newItem);
      }
      
      this.showForm = false;
      this.resetForm();
    },
    
    // Delete with confirmation via modal
    deleteItem(item) {
      const modal = this.$root.$refs.modal;
      if (modal) {
        modal.open({
          title: 'Konfirmasi Hapus',
          content: `
            <p>Apakah Anda yakin ingin menghapus <strong>${item.judul}</strong> (Kode: ${item.kode})?</p>
            <p style="color:#dc2626; margin-top:12px;">Tindakan ini tidak dapat dibatalkan.</p>
          `,
          confirmText: 'Ya, Hapus',
          onConfirm: () => {
            const index = this.items.findIndex(i => i.id === item.id);
            if (index !== -1) {
              this.items.splice(index, 1);
              this.$emit('deleted', item);
            }
          }
        });
      } else {
        // Fallback
        if (confirm(`Hapus ${item.judul}?`)) {
          const index = this.items.findIndex(i => i.id === item.id);
          if (index !== -1) this.items.splice(index, 1);
        }
      }
    },
    
    resetFilters() {
      this.filterUpbjj = '';
      this.filterKategori = '';
      this.filterLowStock = false;
      this.searchTerm = '';
      this.sortBy = 'judul';
      this.sortOrder = 'asc';
    },
    
    resetForm() {
      this.currentItem = {
        id: null, kode: '', judul: '', kategori: '', upbjj: '', lokasiRak: '',
        harga: 0, qty: 0, safety: 0, catatanHTML: ''
      };
    },
    
    // Handle Enter key in form
    handleFormKeydown(e) {
      if (e.key === 'Enter') {
        this.saveItem();
      }
    },
    
    // Toggle sort
    toggleSort(field) {
      if (this.sortBy === field) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortBy = field;
        this.sortOrder = 'asc';
      }
    }
  },
  template: `
    <div>
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="number">{{ totalItems }}</div>
          <div class="label">Total Item Ditampilkan</div>
        </div>
        <div class="stat-card">
          <div class="number" style="color:#ea580c">{{ lowStockCount }}</div>
          <div class="label">Stok Menipis / Kosong</div>
        </div>
        <div class="stat-card">
          <div class="number">{{ formatRupiah(totalValue) }}</div>
          <div class="label">Total Nilai Stok</div>
        </div>
      </div>
      
      <!-- Filters -->
      <div class="filters">
        <div class="filter-group">
          <label>🔍 Cari Data</label>
          <input type="text" v-model="searchTerm" placeholder="Cari judul, kode, atau UT-Daerah..." />
        </div>
        
        <div class="filter-group">
          <label>📍 UT-Daerah</label>
          <select v-model="filterUpbjj">
            <option value="">Semua UT-Daerah</option>
            <option v-for="upbjj in upbjjList" :key="upbjj" :value="upbjj">{{ upbjj }}</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>📚 Kategori Mata Kuliah</label>
          <select v-model="filterKategori" :disabled="!filterUpbjj && filteredCategories.length === 0">
            <option value="">Semua Kategori</option>
            <option v-for="cat in filteredCategories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <small v-if="filterUpbjj" style="color:#64748b">Menampilkan kategori untuk {{ filterUpbjj }}</small>
        </div>
        
        <div class="filter-group">
          <label>⚠️ Filter Stok Kritis</label>
          <div style="display:flex; align-items:center; gap:8px; padding-top:4px;">
            <input type="checkbox" id="lowStock" v-model="filterLowStock" style="width:18px; height:18px;" />
            <label for="lowStock" style="margin:0; cursor:pointer;">Hanya tampilkan stok menipis/kosong</label>
          </div>
        </div>
        
        <div class="filter-group">
          <label>🔃 Urutkan Berdasarkan</label>
          <div style="display:flex; gap:8px;">
            <select v-model="sortBy" style="flex:1;">
              <option value="judul">Judul</option>
              <option value="qty">Jumlah Stok</option>
              <option value="harga">Harga</option>
            </select>
            <button class="btn btn-sm btn-outline" @click="toggleSort(sortBy)" style="padding:8px 12px;">
              {{ sortOrder === 'asc' ? '↑' : '↓' }}
            </button>
          </div>
        </div>
        
        <div style="display:flex; align-items:flex-end; gap:8px;">
          <button class="btn btn-outline" @click="resetFilters" style="height:42px;">
            Reset Filter
          </button>
          <button class="btn btn-success" @click="openAddForm" style="height:42px;">
            Tambah Bahan Ajar
          </button>
        </div>
      </div>
      
      <!-- Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Kode / Judul</th>
              <th>Kategori</th>
              <th>UT-Daerah</th>
              <th>Lokasi Rak</th>
              <th>Harga</th>
              <th>Stok</th>
              <th>Safety Stock</th>
              <th>Status</th>
              <th style="width:140px;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in processedItems" :key="item.id">
              <td>
                <strong>{{ item.kode }}</strong><br>
                <span style="color:#475569; font-size:0.9rem;">{{ item.judul }}</span>
              </td>
              <td><span class="badge" style="background:#e0e7ff; color:#1e40af; padding:2px 8px; border-radius:4px; font-size:0.8rem;">{{ item.kategori }}</span></td>
              <td>{{ item.upbjj }}</td>
              <td><code style="background:#f1f5f9; padding:2px 6px; border-radius:4px;">{{ item.lokasiRak }}</code></td>
              <td><strong>{{ formatRupiah(item.harga) }}</strong></td>
              <td>
                <span :style="{ color: item.qty === 0 ? '#dc2626' : (item.qty < item.safety ? '#ea580c' : '#166534'), fontWeight: '700' }">
                  {{ formatQty(item.qty) }}
                </span>
              </td>
              <td>{{ formatQty(item.safety) }}</td>
              <td>
                <div class="tooltip">
                  <status-badge :qty="item.qty" :safety="item.safety"></status-badge>
                  <span class="tooltiptext" v-html="item.catatanHTML || 'Tidak ada catatan'"></span>
                </div>
              </td>
              <td>
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                  <button class="btn btn-sm btn-primary" @click="openEditForm(item)"> Edit</button>
                  <button class="btn btn-sm btn-danger" @click="deleteItem(item)">Hapus</button>
                </div>
              </td>
            </tr>
            
            <tr v-if="processedItems.length === 0">
              <td colspan="9" style="text-align:center; padding:40px; color:#64748b;">
                Tidak ada data yang sesuai dengan filter.<br>
                <button class="btn btn-sm btn-outline" @click="resetFilters" style="margin-top:12px;">Reset Semua Filter</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Add/Edit Form Modal -->
      <div v-if="showForm" class="modal show" @click.self="showForm=false">
        <div class="modal-content" style="max-width:620px;">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Edit Data Bahan Ajar' : 'Tambah Bahan Ajar Baru' }}</h3>
            <button @click="showForm=false" style="background:none;border:none;font-size:1.5rem;cursor:pointer;">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>Kode Mata Kuliah *</label>
                <input type="text" v-model="currentItem.kode" placeholder="MK101" @keydown="handleFormKeydown" />
              </div>
              <div class="form-group">
                <label>Nama / Judul Mata Kuliah *</label>
                <input type="text" v-model="currentItem.judul" placeholder="Pengantar Ilmu Hukum" @keydown="handleFormKeydown" />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Kategori *</label>
                <input type="text" v-model="currentItem.kategori" placeholder="Hukum / Matematika / ..." @keydown="handleFormKeydown" />
              </div>
              <div class="form-group">
                <label>UT-Daerah *</label>
                <select v-model="currentItem.upbjj">
                  <option v-for="u in upbjjList" :key="u" :value="u">{{ u }}</option>
                </select>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Lokasi Rak</label>
                <input type="text" v-model="currentItem.lokasiRak" placeholder="Rak A-01" @keydown="handleFormKeydown" />
              </div>
              <div class="form-group">
                <label>Harga (Rp) *</label>
                <input type="number" v-model.number="currentItem.harga" min="0" step="1000" @keydown="handleFormKeydown" />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Jumlah Stok (buah) *</label>
                <input type="number" v-model.number="currentItem.qty" min="0" @keydown="handleFormKeydown" />
              </div>
              <div class="form-group">
                <label>Safety Stock (buah) *</label>
                <input type="number" v-model.number="currentItem.safety" min="0" @keydown="handleFormKeydown" />
              </div>
            </div>
            
            <div class="form-group">
              <label>Catatan (HTML diizinkan untuk tooltip)</label>
              <textarea v-model="currentItem.catatanHTML" rows="3" placeholder="Contoh: <strong>Stok aman</strong> untuk semester ini."></textarea>
              <small style="color:#64748b">Catatan ini akan muncul saat hover pada kolom Status</small>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showForm=false">Batal</button>
            <button class="btn btn-success" @click="saveItem">
              {{ isEditing ? '💾 Simpan Perubahan' : '➕ Tambahkan Data' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
});