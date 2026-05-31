// App Modal Component - Reusable modal for confirmation, forms, details
Vue.component('app-modal', {
  props: {
    title: {
      type: String,
      default: 'Modal'
    }
  },
  data() {
    return {
      isOpen: false,
      content: '',
      onConfirm: null,
      confirmText: 'Ya, Lanjutkan',
      cancelText: 'Batal',
      showFooter: true,
      size: 'normal' // normal or large
    };
  },
  methods: {
    open(options = {}) {
      this.title = options.title || 'Konfirmasi';
      this.content = options.content || '';
      this.onConfirm = options.onConfirm || null;
      this.confirmText = options.confirmText || 'Ya, Lanjutkan';
      this.cancelText = options.cancelText || 'Batal';
      this.showFooter = options.showFooter !== false;
      this.size = options.size || 'normal';
      this.isOpen = true;
      
      // Focus trap for accessibility
      this.$nextTick(() => {
        const firstInput = this.$el.querySelector('input, select, textarea, button');
        if (firstInput) firstInput.focus();
      });
    },
    
    close() {
      this.isOpen = false;
      this.onConfirm = null;
    },
    
    confirm() {
      if (this.onConfirm) {
        this.onConfirm();
      }
      this.close();
    },
    
    // Allow parent to control content via slots or by calling methods
    setContent(html) {
      this.content = html;
    }
  },
  template: `
    <div class="modal" :class="{ show: isOpen }" @click.self="close">
      <div class="modal-content" :style="{ maxWidth: size === 'large' ? '720px' : '520px' }">
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button @click="close" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:#64748b;">&times;</button>
        </div>
        
        <div class="modal-body" v-html="content"></div>
        
        <div class="modal-footer" v-if="showFooter">
          <button class="btn btn-outline" @click="close">{{ cancelText }}</button>
          <button class="btn btn-primary" @click="confirm" v-if="onConfirm">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  `
});