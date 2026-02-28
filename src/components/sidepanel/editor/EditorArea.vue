<template>
  <div class="main">
    <!-- Platform Tabs Bar -->
    <div class="platform-tabs-bar" v-if="enabledPlatforms.length">
      <div class="platforms-list">
        <button
          v-for="p in enabledPlatforms"
          :key="p.value"
          class="platform-tab-btn"
          :class="{ active: activePlatform === p.value }"
          @click="$emit('update:activePlatform', p.value)"
          :title="p.label"
        >
          <span class="p-dot">{{ getPlatformInitial(p.value) }}</span>
        </button>
        <button class="platform-tab-btn more" @click="$emit('open-platforms')" title="选择更多平台">···</button>
      </div>
      <div class="spacer"></div>
      <div class="top-bar-actions">
        <button class="schedule-btn" @click="$emit('schedule')">定时发布</button>
        <button class="publish-btn" @click="$emit('publish')" :disabled="!enabledPlatforms.length">立即发布</button>
      </div>
    </div>

    <!-- Editor Canvas -->
    <div class="editor-canvas">
      <div class="editor-container">
        <div class="writing-area">
          <!-- Sync Mode Toggle -->
          <div v-if="enabledPlatforms.length > 1" class="sync-mode-banner">
            <span class="sync-label">Sync with {{ enabledPlatforms.find(p => p.value === activePlatform)?.label || 'PostBot' }}</span>
            <button class="sync-switch" :class="{ active: synced }" @click="$emit('toggle-sync')" :title="synced ? '切换为独立编辑' : '切换为同步模式'">
              <span class="switch-circle"></span>
            </button>
          </div>

          <div class="author-info" v-if="activePlatform">
            <div class="p-dot p-dot-large">{{ getPlatformInitial(activePlatform) }}</div>
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

.platform-tabs-bar {
  height: 56px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid @border-vis;
  background: rgba(255, 255, 255, 0.01);
}

.platforms-list {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  flex: 0 1 auto;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
}

.platform-tab-btn {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid transparent;
  background: #3f3f46;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: #52525b;
  }

  &.active {
    border-color: @accent;
    background: #52525b;
  }

  &.more {
    font-size: 12px;
    font-weight: 600;
    color: #e4e4e7;
  }
}

.spacer {
  flex: 1;
}

.sync-mode-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  margin: 16px 0;
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.15);
}

.sync-label {
  font-size: 13px;
  color: #e4e4e7;
  flex: 1;
}

.sync-switch {
  flex-shrink: 0;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: #3f3f46;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  padding: 2px;
  transition: background 0.2s;

  &:hover {
    background: #52525b;
  }

  &.active {
    background: #10b981;
  }

  .switch-circle {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    position: absolute;
    left: 2px;
    transition: left 0.2s;
  }

  &.active .switch-circle {
    left: 22px;
  }
}

.top-bar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.schedule-btn {
  background: #f59e0b; color: #fff; border: none;
  padding: 8px 16px; border-radius: 20px; font-weight: 600; cursor: pointer;
  font-size: 13px;
}

.publish-btn {
  background: @accent; color: #fff; border: none;
  padding: 8px 20px; border-radius: 20px; font-weight: 600; cursor: pointer;
  font-size: 13px;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
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


.writing-area { background: transparent; }

.author-info {
  display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
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
  width: 100%; height: 100%;
  border-radius: 50%; font-size: 13px; font-weight: 700; color: #e4e4e7;
  background: #3f3f46;
}

.p-dot-large {
  width: 40px; height: 40px;
  font-size: 16px;
}
</style>
