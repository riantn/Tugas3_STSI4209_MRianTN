// Order Form Component - Pemesanan Bahan Ajar (creates new DO)
Vue.component('order-form', {
  props: {
    paket: {
      type: Array,
      required: true
    },
    ekspedisi: {
      type: Array,
      default: () => ['JNE Regular', 'JNE Express']
    }
  },
  data() {
    return {
      form: {
        nim: '',
        nama: '',
        paketId: '',
        ekspedisi: 'JNE Regular',
        tanggalKirim: '',
        alamat: '',
        catatan: ''
      },
      selectedPaket: null,
      errors: {}
    };
  },
  computed: {
    totalHarga() {
      return this.selectedPaket ? this.selectedPaket.harga : 0;
    }
  },
  watch: {
    'form.paketId'(newId) {
      if (newId) {
        this.selectedPaket = this.paket.find(p => p.id == newId) || null;
      } else {
        this.selectedPaket = null;
      }
      this.errors.paketId = '';
    },
    
    // Auto set today's date
    form: {
      handler() {
        if (!this.form.tanggalKirim) {
          const today = new Date().toISOString().split('T')[0];
          this.form.tanggalKirim = today;
        }
      },
      immediate: true
    }
  },
  methods: {
    formatRupiah(amount) {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount);
    },
    
    validateForm() {
      this.errors = {};
      let isValid = true;
      
      if (!this.form.nim || this.form.nim.length < 8) {
        this.errors.nim = 'NIM minimal 8 karakter';
        isValid = false;
      }
      if (!this.form.nama || this.form.nama.length < 3) {
        this.errors.nama = 'Nama minimal 3 karakter';
        isValid = false;
      }
      if (!this.form.paketId) {
        this.errors.paketId = 'Silakan pilih paket bahan ajar';
        isValid = false;
      }
      if (!this.form.tanggalKirim) {
        this.errors.tanggalKirim = 'Tanggal kirim wajib diisi';
        isValid = false;
      }
      if (!this.form.alamat || this.form.alamat.length < 10) {
        this.errors.alamat = 'Alamat minimal 10 karakter';
        isValid = false;
      }
      
      return isValid;
    },
    
    submitOrder() {
      if (!this.validateForm()) {
        return;
      }
      
      const paket = this.selectedPaket;
      
      const newOrder = {
        noDO: ApiService.generateNextDONumber([]), // Will be regenerated in parent
        nim: this.form.nim,
        nama: this.form.nama,
        ekspedisi: this.form.ekspedisi,
        paket: {
          kodePaket: paket.kodePaket,
          namaPaket: paket.namaPaket,
          harga: paket.harga
        },
        tanggalKirim: this.form.tanggalKirim,
        totalHarga: paket.harga,
        alamat: this.form.alamat,
        catatan: this.form.catatan,
        statusHistory: [
          {
            waktu: new Date().toLocaleString('id-ID'),
            keterangan: 'Pesanan diterima dari mahasiswa dan sedang diproses'
          }
        ]
      };
      
      // Emit to parent
      this.$emit('created', newOrder);
      
      // Reset form
      this.resetForm();
      
      // Success message
      const successDiv = document.createElement('div');
      successDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:#16a34a;color:white;padding:16px 24px;border-radius:12px;box-shadow:0 10px 15px -3px rgb(0 0 0 / 0.2);z-index:9999;display:flex;align-items:center;gap:12px;';
      successDiv.innerHTML = `
        <span style="font-size:1.5rem;">🎉</span>
        <div>
          <strong>Pesanan Berhasil Dibuat!</strong><br>
          <span style="font-size:0.9rem;opacity:0.95;">Nomor DO: ${newOrder.noDO} • Akan segera diproses</span>
        </div>
      `;
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        successDiv.style.transition = 'all 0.4s';
        successDiv.style.opacity = '0';
        successDiv.style.transform = 'translateY(-20px)';
        setTimeout(() => successDiv.remove(), 400);
      }, 3800);
    },
    
    resetForm() {
      this.form = {
        nim: '',
        nama: '',
        paketId: '',
        ekspedisi: 'JNE Regular',
        tanggalKirim: new Date().toISOString().split('T')[0],
        alamat: '',
        catatan: ''
      };
      this.selectedPaket = null;
      this.errors = {};
    },
    
    handleKeydown(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.submitOrder();
      }
    }
  },
  template: `
    <div style="max-width:780px; margin:0 auto;">
      <div style="text-align:center; margin-bottom:32px;">
        <div style="font-size:3.5rem; margin-bottom:12px;">📦</div>
        <h2 style="color:#1e293b; margin-bottom:8px;">Form Pemesanan Bahan Ajar</h2>
        <p style="color:#64748b; max-width:420px; margin:0 auto;">Isi formulir berikut untuk memesan paket bahan ajar. Pesanan akan dibuat sebagai Delivery Order (DO) baru.</p>
      </div>
      
      <div style="background:white; border:1px solid #e2e8f0; border-radius:16px; padding:32px; box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1);">
        <div class="form-row">
          <div class="form-group">
            <label>NIM Mahasiswa *</label>
            <input type="text" v-model="form.nim" placeholder="2023123456" maxlength="10" @keydown="handleKeydown" :class="{ 'error': errors.nim }" />
            <span v-if="errors.nim" style="color:#dc2626; font-size:0.85rem;">{{ errors.nim }}</span>
          </div>
          <div class="form-group">
            <label>Nama Lengkap *</label>
            <input type="text" v-model="form.nama" placeholder="Nama Lengkap Mahasiswa" @keydown="handleKeydown" :class="{ 'error': errors.nama }" />
            <span v-if="errors.nama" style="color:#dc2626; font-size:0.85rem;">{{ errors.nama }}</span>
          </div>
        </div>
        
        <div class="form-group">
          <label>Paket Bahan Ajar *</label>
          <select v-model="form.paketId" @change="errors.paketId = ''" :class="{ 'error': errors.paketId }">
            <option value="">-- Pilih Paket yang Diinginkan --</option>
            <option v-for="p in paket" :key="p.id" :value="p.id">
              {{ p.kodePaket }} — {{ p.namaPaket }} ({{ formatRupiah(p.harga) }})
            </option>
          </select>
          <span v-if="errors.paketId" style="color:#dc2626; font-size:0.85rem;">{{ errors.paketId }}</span>
        </div>
        
        <!-- Selected Paket Info -->
        <div v-if="selectedPaket" style="background:#f0fdf4; border:1px solid #86efac; padding:16px; border-radius:10px; margin-bottom:20px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <strong style="color:#166534;">{{ selectedPaket.namaPaket }}</strong>
              <div style="font-size:0.9rem; color:#4ade80; margin-top:4px;">Kode: {{ selectedPaket.kodePaket }}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:1.1rem; font-weight:800; color:#15803d;">{{ formatRupiah(selectedPaket.harga) }}</div>
              <div style="font-size:0.75rem; color:#4ade80;">Total Harga</div>
            </div>
          </div>
          
          <div style="margin-top:12px; font-size:0.9rem;">
            <strong>Isi Paket:</strong>
            <ul style="margin:6px 0 0 18px; padding:0; color:#166534;">
              <li v-for="(item, i) in selectedPaket.isi" :key="i" style="margin-bottom:2px;">{{ item }}</li>
            </ul>
          </div>
          <div style="margin-top:8px; font-size:0.85rem; color:#4ade80; font-style:italic;">{{ selectedPaket.deskripsi }}</div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Ekspedisi Pengiriman *</label>
            <select v-model="form.ekspedisi">
              <option v-for="e in ekspedisi" :key="e" :value="e">{{ e }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Tanggal Kirim *</label>
            <input type="date" v-model="form.tanggalKirim" :class="{ 'error': errors.tanggalKirim }" />
            <span v-if="errors.tanggalKirim" style="color:#dc2626; font-size:0.85rem;">{{ errors.tanggalKirim }}</span>
          </div>
        </div>
        
        <div class="form-group">
          <label>Alamat Lengkap Pengiriman *</label>
          <textarea v-model="form.alamat" rows="3" placeholder="Jl. Contoh No. 123, RT/RW 01/02, Kelurahan..., Kecamatan..., Kota..., Provinsi... 12345" @keydown="handleKeydown" :class="{ 'error': errors.alamat }"></textarea>
          <span v-if="errors.alamat" style="color:#dc2626; font-size:0.85rem;">{{ errors.alamat }}</span>
        </div>
        
        <div class="form-group">
          <label>Catatan Tambahan (opsional)</label>
          <textarea v-model="form.catatan" rows="2" placeholder="Contoh: Mohon dikirim sebelum tanggal 10 Juni. Terima kasih."></textarea>
        </div>
        
        <div style="display:flex; gap:12px; margin-top:24px;">
          <button type="button" class="btn btn-outline" @click="resetForm" style="flex:1;">Reset Form</button>
          <button type="button" class="btn btn-success" @click="submitOrder" style="flex:2; font-size:1.05rem;">
            Buat Pesanan &amp; Generate DO
          </button>
        </div>
        
        <div style="text-align:center; margin-top:16px; font-size:0.8rem; color:#94a3b8;">
          Tekan <strong>Enter</strong> di field manapun untuk langsung submit • Data akan masuk ke halaman Tracking DO
        </div>
      </div>
    </div>
  `
});