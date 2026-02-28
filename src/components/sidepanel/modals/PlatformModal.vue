<template>
  <div class="overlay centered" @click.self="$emit('close')">
    <div class="modal centered-modal">
      <div class="modal-header">
        <span class="modal-title">发布平台</span>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <p class="modal-subtitle">选择要发布此草稿的平台。</p>
        <div class="platform-list">
          <div v-for="p in options" :key="p.value" class="platform-row" @click="$emit('toggle', p.value)">
            <div class="platform-row-left">
              <div class="p-dot" :style="{ background: getPlatformColor(p.value) }">
                {{ getPlatformInitial(p.value) }}
              </div>
              <div class="platform-row-info">
                <div class="name">{{ p.label }}</div>
                <div class="handle">@已登录账号</div>
              </div>
            </div>
            <div class="platform-row-right">
              <div class="toggle-switch" :class="{ on: selectedCodes.includes(p.value) }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  options: { label: string; value: string }[];
  selectedCodes: string[];
  getPlatformColor: (code: string) => string;
  getPlatformInitial: (code: string) => string;
}>();

defineEmits(['close', 'toggle']);
</script>

<style lang="less" scoped>
@surface:      #18181b;
@border:       rgba(255, 255, 255, 0.06);
@text:         #f4f4f5;
@muted:        #71717a;
@accent:       #3b82f6;

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
  .modal-title { font-weight: 700; font-size: 16px; }
}

.modal-close { background: transparent; border: none; color: @muted; cursor: pointer; font-size: 18px; }

.modal-body { padding: 24px; }
.modal-subtitle { color: @muted; font-size: 13px; margin-bottom: 20px; }

.platform-list { display: flex; flex-direction: column; gap: 8px; }

.platform-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px; border-radius: 12px; cursor: pointer;
  &:hover { background: rgba(255,255,255,0.03); }
}

.platform-row-left { display: flex; align-items: center; gap: 12px; }
.platform-row-info {
  .name { font-size: 14px; font-weight: 600; }
  .handle { font-size: 12px; color: @muted; }
}

.toggle-switch {
  width: 36px; height: 20px; border-radius: 10px; background: #3f3f46;
  position: relative; transition: all 0.2s;
  &::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: all 0.2s; }
  &.on { background: @accent; &::after { left: 18px; } }
}

.p-dot {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 50%; font-size: 11px; font-weight: 700; color: #fff;
}
</style>
