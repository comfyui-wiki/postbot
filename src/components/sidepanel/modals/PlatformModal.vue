<template>
  <div class="overlay centered" @click.self="$emit('close')">
    <div class="modal centered-modal">
      <div class="modal-header">
        <span class="modal-title">发布平台</span>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <div class="modal-top">
          <p class="modal-subtitle">选择要发布此草稿的平台。</p>
          <button class="detect-btn" @click="$emit('detect')" :disabled="detecting">
            {{ detecting ? '检测中...' : '检测登录状态' }}
          </button>
        </div>

        <!-- 已检测过且有已登录和未登录平台时显示分隔线和提示 -->
        <div v-if="hasDetected && loggedInCodes.length > 0 && loggedInCodes.length < options.length">
          <div class="divider"></div>
          <div class="login-hint">
            <span>未登录的平台点击前往登录</span>
          </div>
        </div>

        <!-- 所有平台列表 -->
        <div class="platform-list">
          <div v-for="p in options" :key="p.value" class="platform-row">
            <div class="platform-row-left" @click="$emit('toggle', p.value)">
              <div class="p-dot" :style="{ background: getPlatformColor(p.value) }">
                {{ getPlatformInitial(p.value) }}
              </div>
              <div class="platform-row-info">
                <div class="name-with-tag">
                  <span class="name">{{ p.label }}</span>
                  <span v-if="loggedInCodes.includes(p.value)" class="logged-tag">已登录</span>
                </div>
                <!-- 已登录显示账号，未登录显示登录链接 -->
                <div v-if="loggedInCodes.includes(p.value)" class="handle">@账号</div>
                <div v-else class="handle login-link" @click.stop="openPlatformLink(p.link)">
                  前往登录 →
                </div>
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
import { computed } from 'vue';

const props = defineProps<{
  options: { label: string; value: string; link?: string }[];
  selectedCodes: string[];
  loggedInCodes?: string[];
  detecting?: boolean;
  getPlatformColor: (code: string) => string;
  getPlatformInitial: (code: string) => string;
}>();

const emit = defineEmits(['close', 'toggle', 'detect']);

const loggedInCodes = computed(() => props.loggedInCodes ?? []);
const detecting = computed(() => props.detecting ?? false);

// 如果 loggedInCodes 不为空，说明检测过
const hasDetected = computed(() => loggedInCodes.value.length > 0 || (props.loggedInCodes !== undefined && props.loggedInCodes.length === 0));

const openPlatformLink = (link?: string) => {
  if (link && link !== '#') {
    window.open(link, '_blank');
  }
};
</script>

<style lang="less" scoped>
@surface:      #18181b;
@border:       rgba(255, 255, 255, 0.06);
@text:         #f4f4f5;
@muted:        #71717a;
@accent:       #3b82f6;
@success:      #10b981;

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

.modal-body { padding: 24px; max-height: 70vh; overflow-y: auto; }

.modal-top {
  display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 20px;
}

.modal-subtitle { color: @muted; font-size: 13px; margin: 0; }

.detect-btn {
  flex-shrink: 0;
  background: @accent; color: #fff; border: none;
  padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: background 0.2s;

  &:hover:not(:disabled) { background: #2563eb; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.divider {
  height: 1px; background: @border; margin: 16px 0;
}

.login-hint {
  font-size: 12px; color: @muted; padding: 0 0 12px 0; margin-bottom: 8px;
}

.platform-list { display: flex; flex-direction: column; gap: 8px; }

.platform-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px; border-radius: 12px; cursor: pointer;
  &:hover { background: rgba(255,255,255,0.03); }
}

.platform-row-left { display: flex; align-items: center; gap: 12px; }
.platform-row-info {
  .name-with-tag {
    display: flex; align-items: center; gap: 8px;
  }
  .name { font-size: 14px; font-weight: 600; color: @text; }
  .logged-tag {
    font-size: 11px; font-weight: 600; color: #fff; background: @success; padding: 2px 8px; border-radius: 6px;
  }
  .handle { font-size: 12px; color: @muted; background: transparent !important; margin-top: 4px;
    &.login-link { color: @accent; cursor: pointer; &:hover { text-decoration: underline; } }
  }
}

.toggle-switch {
  width: 36px; height: 20px; border-radius: 10px; background: #3f3f46;
  position: relative; transition: all 0.2s;
  &::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: all 0.2s; }
  &.on { background: @accent; &::after { left: 18px; } }
}

.p-dot {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 50%; font-size: 11px; font-weight: 700; color: #fff !important;
}
</style>
