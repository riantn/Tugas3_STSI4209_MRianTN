// API Service for SITTA Bahan Ajar (Updated for new dataBahanAjar.json structure)
// Handles data loading + normalization so existing components continue to work

const ApiService = {
  async fetchData() {
    try {
      const response = await fetch('./data/dataBahanAjar.json');
      if (!response.ok) {
        throw new Error('Gagal memuat data');
      }
      const raw = await response.json();
      
      // === NORMALISASI DATA ===
      
      // 1. Stok → bahanAjar (tambahkan id)
      const bahanAjar = (raw.stok || []).map((item, index) => ({
        ...item,
        id: index + 1
      }));
      
      // 2. Paket → paketBahanAjar (tambahkan id + alias field untuk kompatibilitas)
      const paketBahanAjar = (raw.paket || []).map((item, index) => ({
        id: index + 1,
        kodePaket: item.kode,
        namaPaket: item.nama,
        harga: item.harga,
        isi: item.isi || [],
        deskripsi: `Paket ${item.nama}` // fallback deskripsi
      }));
      
      // 3. Ekspedisi → ekspedisiList (string array untuk kompatibilitas)
      const ekspedisiList = (raw.pengirimanList || []).map(p => p.nama); // ["Reguler (3-5 hari)", "Ekspres (1-2 hari)"]
      
      // 4. Tracking → trackingDO (normalisasi struktur aneh { "DOxxxx": { ... } } menjadi array bersih)
      let trackingDO = [];
      if (raw.tracking && Array.isArray(raw.tracking)) {
        raw.tracking.forEach(entry => {
          // entry berbentuk { "DO2025-0001": { ...data... } }
          Object.keys(entry).forEach(noDO => {
            const data = entry[noDO];
            trackingDO.push({
              noDO: noDO,
              nim: data.nim || '',
              nama: data.nama || '',
              ekspedisi: data.ekspedisi || 'JNE',
              paket: {
                kodePaket: data.paket || '',
                namaPaket: data.paket || '',
                harga: data.total || 0
              },
              tanggalKirim: data.tanggalKirim || '',
              totalHarga: data.total || 0,
              statusHistory: (data.perjalanan || []).map(p => ({
                waktu: p.waktu,
                keterangan: p.keterangan
              }))
            });
          });
        });
      }
      
      // 5. upbjjList & kategoriList (langsung pakai)
      const upbjjList = raw.upbjjList || [];
      const kategoriList = raw.kategoriList || [];
      
      return {
        bahanAjar,
        paketBahanAjar,
        upbjjList,
        ekspedisiList,
        trackingDO,
        kategoriList,           // bonus: untuk filter kategori
        pengirimanList: raw.pengirimanList || [] // kalau butuh object asli
      };
      
    } catch (error) {
      console.error('Error fetching data:', error);
      
      // Fallback (struktur lama)
      return {
        bahanAjar: [
          { id: 1, kode: "EKMA4116", judul: "Pengantar Manajemen", kategori: "MK Wajib", upbjj: "Jakarta", lokasiRak: "R1-A3", harga: 65000, qty: 28, safety: 20, catatanHTML: "<em>Edisi 2024</em>" }
        ],
        paketBahanAjar: [
          { id: 1, kodePaket: "PAKET-UT-001", namaPaket: "PAKET IPS Dasar", harga: 120000, isi: ["EKMA4116", "EKMA4115"], deskripsi: "Paket IPS" }
        ],
        upbjjList: ["Jakarta", "Surabaya", "Makassar", "Padang", "Denpasar"],
        ekspedisiList: ["Reguler (3-5 hari)", "Ekspres (1-2 hari)"],
        trackingDO: [],
        kategoriList: ["MK Wajib", "MK Pilihan", "Praktikum", "Problem-Based"],
        pengirimanList: []
      };
    }
  },

  // Helper to generate next DO number
  generateNextDONumber(existingDOs) {
    const currentYear = new Date().getFullYear();
    const prefix = `DO${currentYear}-`;
    
    let maxNum = 0;
    existingDOs.forEach(doItem => {
      if (doItem.noDO && doItem.noDO.startsWith(prefix)) {
        const numStr = doItem.noDO.replace(prefix, '');
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    
    const nextNum = (maxNum + 1).toString().padStart(3, '0');
    return `${prefix}${nextNum}`;
  },

  // Format date to Indonesian format
  formatTanggalIndo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
  },

  // Format currency
  formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }
};

// Make globally available
window.ApiService = ApiService;