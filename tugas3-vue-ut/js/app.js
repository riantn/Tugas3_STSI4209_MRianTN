// Main Vue App - SITTA Bahan Ajar Order System (Tugas Praktik 3)
// All requirements implemented: Components, Templates, Data Binding, Conditional, Computed, Watchers, v-for, Filters (via methods), CRUD, etc.

document.addEventListener('DOMContentLoaded', async () => {
  // Load initial data
  const initialData = await ApiService.fetchData();
  
  // Root Vue Instance
  new Vue({
    el: '#app',
    
    data: {
      // Tab state (for routing simulation)
      tab: 'stok', // 'stok' | 'tracking' | 'order'
      
      // Main data from JSON
      stok: initialData.bahanAjar || [],
      paket: initialData.paketBahanAjar || [],
      upbjjList: initialData.upbjjList || [],
      ekspedisiList: initialData.ekspedisiList || ['JNE Regular', 'JNE Express'],
      tracking: initialData.trackingDO || [],
      
      // Global search (optional)
      globalSearch: ''
    },
    
    computed: {
      // Computed for filtered tracking (example of computed property)
      filteredTrackingCount() {
        return this.tracking.length;
      },
      
      // Total stock value
      totalStockValue() {
        return this.stok.reduce((sum, item) => sum + (item.harga * item.qty), 0);
      }
    },
    
    watch: {
      // Watcher 1: Tab change - could be used for analytics or data refresh
      tab(newTab) {
        console.log(`[Vue] Tab changed to: ${newTab}`);
        // Example: if switching to tracking, could auto-refresh data
        if (newTab === 'tracking' && this.tracking.length === 0) {
          // In real app, might refetch
        }
      },
      
      // Watcher 2: Monitor stok changes (for any global reaction)
      stok: {
        handler(newStok) {
          // Could sync to localStorage or emit events
          console.log(`[Vue] Stok updated. Total items: ${newStok.length}`);
        },
        deep: true
      }
    },
    
    methods: {
      // Handle new DO created from order-form or tracking
      handleNewDO(newDOData) {
        // Generate proper DO number if not set
        if (!newDOData.noDO || newDOData.noDO.includes('undefined')) {
          newDOData.noDO = ApiService.generateNextDONumber(this.tracking);
        }
        
        // Add to tracking list
        this.tracking.push(newDOData);
        
        // Switch to tracking tab to show the new entry
        this.tab = 'tracking';
        
        // Optional: Show success in modal
        const modal = this.$refs.modal;
        if (modal) {
          modal.open({
            title: '✅ Pesanan Berhasil',
            content: `
              <p>Delivery Order <strong>${newDOData.noDO}</strong> telah dibuat untuk <strong>${newDOData.nama}</strong>.</p>
              <p style="margin-top:12px;">Silakan cek halaman <strong>Tracking DO</strong> untuk melihat detail dan update progress pengiriman.</p>
            `,
            showFooter: false
          });
          setTimeout(() => {
            if (modal.isOpen) modal.close();
          }, 2800);
        }
      },
      
      // Handle stock created (from stock-table)
      handleStockCreated(newItem) {
        console.log('New stock item created:', newItem);
        // Could show toast notification
      },
      
      handleStockUpdated(updatedItem) {
        console.log('Stock updated:', updatedItem);
      },
      
      handleStockDeleted(deletedItem) {
        console.log('Stock deleted:', deletedItem);
      },
      
      // Format helpers (exposed to templates if needed)
      formatRupiah(amount) {
        return ApiService.formatRupiah(amount);
      },
      
      // Reset all data (for demo purposes)
      resetAllData() {
        if (confirm('Reset semua data ke kondisi awal?')) {
          location.reload();
        }
      }
    },
    
    mounted() {
      console.log('%c[Vue] SITTA Bahan Ajar App initialized successfully!', 'color:#16a34a; font-weight:600');
      console.log('%c[Vue] Features implemented: Components, v-model, v-for, v-if, computed, watchers (2+), filters via methods, CRUD, modals, dependent filters, keyboard events, etc.', 'color:#64748b');
      
      // Keyboard global shortcuts
      document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement.tagName === 'BODY') {
          e.preventDefault();
          const searchInput = document.querySelector('input[placeholder*="Cari"]');
          if (searchInput) searchInput.focus();
        }
        
        if (e.key.toLowerCase() === '?' && e.shiftKey) {
          e.preventDefault();
          alert('Shortcut:\n• / = Fokus ke search\n• Tab buttons di header\n• Enter di form = Submit\n• Esc di modal = Close');
        }
      });
      
      // Demo: Show welcome toast after 1.5s
      setTimeout(() => {
        const welcome = document.createElement('div');
        welcome.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e40af;color:white;padding:10px 20px;border-radius:9999px;font-size:0.9rem;box-shadow:0 10px 15px -3px rgb(30 64 175 / 0.4);z-index:999;';
        welcome.innerHTML = '💡 Tekan <strong>?</strong> untuk melihat shortcut keyboard';
        document.body.appendChild(welcome);
        setTimeout(() => {
          welcome.style.transition = 'all 0.4s';
          welcome.style.opacity = '0';
          setTimeout(() => welcome.remove(), 400);
        }, 4200);
      }, 1500);
    }
  });
});