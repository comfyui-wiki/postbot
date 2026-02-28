<template>
  <div class="main">
    <!-- Top bar with Publish/Schedule -->
    <div class="top-bar">
      <div class="top-bar-left">
        <div class="publish-on-hint" v-if="enabledPlatforms.length">
          发布至 
          <span v-for="p in enabledPlatforms" :key="p.value" class="mini-p-icon" :style="{ background: getPlatformColor(p.value) }">
            {{ getPlatformInitial(p.value) }}
          </span>
        </div>
      </div>
      <div class="top-bar-right">
        <div class="sync-toggle" :class="{ active: synced }" @click="$emit('toggle-sync')" title="同步所有平台文案">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
          </svg>
          <span>同步</span>
        </div>
        <button class="schedule-btn" @click="$emit('schedule')">定时发布</button>
        <button class="publish-btn" @click="$emit('publish')" :disabled="!enabledPlatforms.length">立即发布</button>
        <button class="p-settings-btn" @click="$emit('open-platforms')" title="选择发布平台">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Editor Canvas -->
    <div class="editor-canvas">
      <div class="editor-container">
        <!-- Platform Switcher -->
        <div class="editor-platform-tabs" v-if="!synced && enabledPlatforms.length > 1">
          <button 
            v-for="p in enabledPlatforms" 
            :key="p.value"
            class="platform-tab"
            :class="{ active: activePlatform === p.value }"
            @click="$emit('update:activePlatform', p.value)"
          >
            <span class="p-dot sm" :style="{ background: getPlatformColor(p.value) }">{{ getPlatformInitial(p.value) }}</span>
            {{ p.label }}
          </button>
        </div>

        <div class="writing-area">
          <div class="author-info" v-if="activePlatform">
            <div class="p-dot" :style="{ background: getPlatformColor(activePlatform) }">{{ getPlatformInitial(activePlatform) }}</div>
            <div class="author-details">
              <div class="author-name">{{ enabledPlatforms.find(p => p.value === activePlatform)?.label || 'PostBot' }}</div>
              <div class="author-handle">@postbot</div>
            </div>
          </div>

          <textarea
            ref="textareaRef"
            class="main-editor"
            :value="content"
            @input="onInput"
            :placeholder="editorPlaceholder"
          />

          <!-- Media Previews -->
          <div class="media-grid" v-if="imageUrls.length">
            <div class="media-item" v-for="(url, i) in imageUrls" :key="i">
              <img :src="url" />
              <button class="media-remove" @click="$emit('remove-image', i)">✕</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Toolbar -->
    <div class="floating-toolbar">
      <button class="float-btn" @click="$emit('add-image')" title="添加图片">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
        </svg>
      </button>
      <div class="v-divider"></div>
      <select class="type-select" :value="mediaType" @change="onMediaTypeChange">
        <option value="moment">动态</option>
        <option value="article">文章</option>
        <option value="video">视频</option>
      </select>
      <div class="v-divider"></div>
      <div class="char-count">{{ content.length }} 字</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick } from 'vue';

const props = defineProps<{
  content: string;
  synced: boolean;
  enabledPlatforms: any[];
  activePlatform: string | null;
  imageUrls: string[];
  mediaType: string;
  getPlatformColor: (code: string) => string;
  getPlatformInitial: (code: string) => string;
}>();

const emit = defineEmits([
  'update:content', 
  'update:activePlatform', 
  'update:mediaType',
  'toggle-sync', 
  'publish', 
  'schedule', 
  'open-platforms', 
  'add-image', 
  'remove-image'
]);

const textareaRef = ref<HTMLTextAreaElement | null>(null);

const editorPlaceholder = computed(() => {
  if (props.synced) return '写点什么...';
  const p = props.enabledPlatforms.find((p: any) => p.value === props.activePlatform);
  return p ? ('正在为 ' + p.label + ' 编写独立文案...') : '写点什么...';
});

const autoResize = () => {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
};

const onInput = (e: Event) => {
  const val = (e.target as HTMLTextAreaElement).value;
  emit('update:content', val);
  autoResize();
};

const onMediaTypeChange = (e: Event) => {
  emit('update:mediaType', (e.target as HTMLSelectElement).value);
};

watch(() => props.content, () => {
  nextTick(autoResize);
});

watch(() => props.activePlatform, () => {
  nextTick(autoResize);
});
</script>

<style lang="less" scoped>
@surface:      #18181b;
@border:       rgba(255, 255, 255, 0.06);
@border-vis:   #27272a;
@text:         #f4f4f5;
@muted:        #71717a;
@accent:       #3b82f6;
@accent-hover: #2563eb;

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.top-bar {
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid @border-vis;
}

.publish-on-hint {
  font-size: 12px;
  color: @muted;
  display: flex;
  align-items: center;
  gap: 6px;
}

.mini-p-icon {
  width: 16px; height: 16px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 8px; color: #fff; font-weight: 700;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sync-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: @muted;
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: rgba(255,255,255,0.05); }
  &.active { color: #10b981; background: rgba(16,185,129,0.1); }
}

.schedule-btn {
  background: #f59e0b; color: #fff; border: none;
  padding: 8px 16px; border-radius: 20px; font-weight: 600; cursor: pointer;
}

.publish-btn {
  background: @accent; color: #fff; border: none;
  padding: 8px 20px; border-radius: 20px; font-weight: 600; cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.p-settings-btn {
  background: transparent; border: none; color: @muted; cursor: pointer;
  &:hover { color: @text; }
}

.editor-canvas {
  flex: 1;
  overflow-y: auto;
  padding: 40px 20px;
  display: flex;
  justify-content: center;
}

.editor-container {
  width: 100%;
  max-width: 600px;
}

.editor-platform-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.platform-tab {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px; border-radius: 20px; border: 1px solid @border;
  background: transparent; color: @muted; font-size: 12px; cursor: pointer;
  &.active { background: @surface; color: @text; border-color: @muted; }
}

.writing-area { background: transparent; }

.author-info {
  display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
  .p-dot { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; }
  .author-name { font-weight: 700; font-size: 15px; }
  .author-handle { color: @muted; font-size: 13px; }
}

.main-editor {
  width: 100%;
  min-height: 200px;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  color: @text;
  font-size: 18px;
  line-height: 1.6;
  padding: 0;
  &::placeholder { color: #3f3f46; }
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 24px;
}

.media-item {
  position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 1;
  img { width: 100%; height: 100%; object-fit: cover; }
}

.media-remove {
  position: absolute; top: 8px; right: 8px; width: 24px; height: 24px;
  border-radius: 50%; background: rgba(0,0,0,0.5); border: none; color: #fff; cursor: pointer;
}

.floating-toolbar {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: @surface;
  border: 1px solid @border;
  padding: 8px 16px;
  border-radius: 32px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.float-btn { background: transparent; border: none; color: @muted; cursor: pointer; &:hover { color: @text; } }
.v-divider { width: 1px; height: 20px; background: @border; }
.type-select { background: transparent; border: none; color: @muted; font-size: 12px; cursor: pointer; outline: none; }
.char-count { font-size: 12px; color: @muted; font-variant-numeric: tabular-nums; }

.p-dot {
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%; font-size: 11px; font-weight: 700; color: #fff;
  &.sm { width: 20px; height: 20px; font-size: 8px; }
}
</style>
