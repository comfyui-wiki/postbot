<template>
  <div class="overlay centered" @click.self="$emit('close')">
    <div class="modal centered-modal">
      <div class="modal-header">
        <span class="modal-title">设置与账号</span>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body settings-body">
        <button class="detect-btn-large" :disabled="loading" @click="$emit('detect')">
          {{ loading ? '检测中...' : '检测已登录账号' }}
        </button>
        <div v-if="successMsg" class="detect-msg success">{{ successMsg }}</div>
        <div v-if="errorMsg" class="detect-msg error">{{ errorMsg }}</div>
        
        <div class="account-links">
          <div v-if="!links.length && !loading && !successMsg && !errorMsg" class="no-accounts">
            点击上方按钮开始检测已登录账号
          </div>
          <a v-for="item in links" :key="item.value" :href="item.link" target="_blank" class="account-link">
            <span class="p-dot sm" :style="{ background: getPlatformColor(item.value) }">
              {{ getPlatformInitial(item.value) }}
            </span>
            <span>{{ item.label }}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  loading: boolean;
  successMsg: string;
  errorMsg: string;
  links: { label: string; value: string; link: string }[];
  getPlatformColor: (code: string) => string;
  getPlatformInitial: (code: string) => string;
}>();

defineEmits(['close', 'detect']);
</script>

<style lang="less" scoped>
@surface:      #18181b;
@border:       rgba(255, 255, 255, 0.06);
@text:         #f4f4f5;
@accent:       #3b82f6;
@muted:        #71717a;

.overlay.centered {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 100;
}

.centered-modal {
  width: 100%; max-width: 480px; background: @surface; border-radius: 20px;
  border: 1px solid @border; overflow: hidden;
}

.modal-header {
  padding: 20px 24px; border-bottom: 1px solid @border;
  display: flex; justify-content: space-between; align-items: center;
  .modal-title { font-weight: 700; font-size: 16px; color: @text; }
}

.modal-close { background: transparent; border: none; color: @muted; cursor: pointer; font-size: 18px; }

.settings-body { padding: 24px; }

.detect-btn-large {
  width: 100%; padding: 12px; border-radius: 12px; background: @accent; color: #fff;
  border: none; font-weight: 600; cursor: pointer; margin-bottom: 16px;
  transition: opacity 0.2s;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.detect-msg {
  font-size: 12px; padding: 10px; border-radius: 8px; margin-bottom: 12px;
  &.success { background: rgba(16, 185, 129, 0.1); color: #34d399; }
  &.error { background: rgba(239, 68, 68, 0.1); color: #f87171; }
}

.account-links { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }

.no-accounts {
  text-align: center;
  padding: 20px;
  color: @muted;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px dashed @border;
}

.account-link {
  display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 8px;
  background: rgba(255,255,255,0.03) !important; text-decoration: none; color: @text; font-size: 13px;
  transition: background 0.2s;
  &:hover { background: rgba(255,255,255,0.05); }

  span {
    background: transparent !important;
  }
}

.p-dot {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: 50%; font-size: 9px; font-weight: 700; color: #fff !important;

  &.sm {
    width: 20px;
    height: 20px;
    font-size: 8px;
  }
}
</style>
