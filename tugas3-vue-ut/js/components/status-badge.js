// Status Badge Component - Reusable for stock status
Vue.component('status-badge', {
  props: {
    qty: {
      type: Number,
      required: true
    },
    safety: {
      type: Number,
      required: true
    }
  },
  computed: {
    status() {
      if (this.qty === 0) return 'kosong';
      if (this.qty < this.safety) return 'menipis';
      return 'aman';
    },
    statusText() {
      if (this.qty === 0) return 'Kosong';
      if (this.qty < this.safety) return 'Menipis';
      return 'Aman';
    },
    statusClass() {
      return `status-badge status-${this.status}`;
    },
    icon() {
      if (this.qty === 0) return '⚠️';
      if (this.qty < this.safety) return '⚡';
      return '✅';
    }
  },
  template: `
    <span :class="statusClass" :title="statusText + ' (Qty: ' + qty + ' / Safety: ' + safety + ')'">
      <span>{{ icon }}</span>
      <span>{{ statusText }}</span>
    </span>
  `
});