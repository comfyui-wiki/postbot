<template>
  <div class="main">
    <!-- Platform Tabs Bar or Initial Setup -->
    <div v-if="enabledPlatforms.length" class="platform-tabs-bar">
      <div class="platforms-list">
        <button
          v-for="p in enabledPlatforms"
          :key="p.value"
          class="platform-tab-btn"
          :class="{ active: activePlatform === p.value, warning: platformLimitStatus?.[p.value] }"
          @click="$emit('update:activePlatform', p.value)"
          :title="`${p.label}${platformLimitStatus?.[p.value] ? ' ⚠️ 内容不符合平台限制' : ''}`"
        >
          {{ getPlatformInitial(p.value) }}
          <span v-if="platformLimitStatus?.[p.value]" class="warning-indicator">⚠️</span>
        </button>
        <button class="platform-tab-btn more" @click="$emit('open-platforms')" title="选择更多平台">···</button>
      </div>
      <div class="spacer"></div>
      <div class="top-bar-actions">
        <button class="publish-btn" @click="$emit('publish')" :disabled="!enabledPlatforms.length">立即发布</button>
      </div>
    </div>

    <!-- Initial Setup Bar (no platforms selected) -->
    <div v-else class="initial-setup-bar">
      <div class="setup-content">
        <span class="setup-icon">🚀</span>
        <span class="setup-text">选择发布平台开始使用</span>
      </div>
      <button class="setup-btn" @click="$emit('open-platforms')">···</button>
    </div>

    <!-- Editor Canvas -->
    <div class="editor-canvas">
      <div class="editor-container">
        <div class="writing-area">
          <!-- Sync Mode Toggle (Hide for first platform) -->
          <div v-if="enabledPlatforms.length > 1 && !isFirstPlatform" class="sync-mode-banner">
            <span class="sync-label">与主文案同步</span>
            <button class="sync-switch" :class="{ active: synced }" @click="$emit('toggle-sync')" :title="synced ? '切换为独立编辑' : '切换为同步模式'">
              <span class="switch-circle"></span>
            </button>
          </div>

          <!-- Platform Limit Warnings -->
          <div v-if="platformLimitWarnings && platformLimitWarnings.length > 0" class="platform-limit-warning">
            <div class="warning-header">
              <span class="warning-icon">⚠️</span>
              <span class="warning-title">内容不符合该平台的限制</span>
            </div>
            <ul class="warning-list">
              <li v-for="(warning, index) in platformLimitWarnings" :key="index">{{ warning }}</li>
            </ul>
            <p class="warning-hint">建议切换为独立编辑模式，为该平台专门调整内容</p>
          </div>

          <div class="author-info" v-if="activePlatform">
            <div class="p-dot p-dot-large">{{ getPlatformInitial(activePlatform) }}</div>
            <div class="author-details">
              <div class="author-name">{{ enabledPlatforms.find(p => p.value === activePlatform)?.label || 'PostBot' }}</div>
              <div class="author-handle">@postbot</div>
            </div>
          </div>

          <!-- Title Input (for platforms that need it) -->
          <div v-if="activePlatformNeedsTitle" class="input-wrapper">
            <input
              type="text"
              class="title-input"
              :value="title"
              @input="onTitleInput"
              placeholder="添加标题"
              :disabled="synced"
            />
            <div class="char-counter title-counter" :class="{ 'over-limit': titleExceedsLimit }">
              {{ title.length }} {{ titleLimitText }}
            </div>
          </div>

          <div class="input-wrapper">
            <textarea
              ref="textareaRef"
              class="main-editor"
              :class="{ disabled: synced }"
              :value="content"
              @input="onInput"
              :placeholder="editorPlaceholder"
              :disabled="synced"
            />
            <div class="char-counter content-counter" :class="{ 'over-limit': contentExceedsLimit }">
              {{ content.length }} {{ contentLimitText }}
            </div>
          </div>

          <!-- Draft Image Metadata Alert -->
          <div v-if="draftImageMetadata && draftImageMetadata.length > 0" class="draft-image-alert">
            <div class="alert-content">
              <span class="alert-icon">📸</span>
              <div class="alert-text">
                <div class="alert-title">该草稿有 {{ draftImageMetadata.length }} 张图片</div>
                <div class="alert-desc">图片已丢失，点击按钮重新加载</div>
              </div>
            </div>
            <button class="reload-btn" @click="$emit('reload-images')">重新加载</button>
          </div>

          <!-- Media Previews with Drag & Drop Sorting -->
          <div class="media-grid" v-if="imageUrls.length">
            <div
              class="media-item"
              v-for="(url, i) in imageUrls"
              :key="i"
              draggable="true"
              @dragstart="onImageDragStart($event, i)"
              @dragover="onImageDragOver($event, i)"
              @drop="onImageDrop($event, i)"
              @dragend="onImageDragEnd"
              :class="{ 'dragging': draggedIndex === i, 'drag-over': dragOverIndex === i }"
            >
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

type ImageMetadata = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
};

const props = defineProps<{
  content: string;
  title: string;
  synced: boolean;
  enabledPlatforms: any[];
  activePlatform: string | null;
  imageUrls: string[];
  mediaType: string;
  isFirstPlatform: boolean;
  activePlatformNeedsTitle: boolean;
  draftImageMetadata?: ImageMetadata[];
  platformLimitWarnings?: string[];
  platformLimitStatus?: Record<string, boolean>;
  getPlatformColor: (code: string) => string;
  getPlatformInitial: (code: string) => string;
}>();

const emit = defineEmits([
  'update:content',
  'update:title',
  'update:activePlatform',
  'update:mediaType',
  'toggle-sync',
  'publish',
  'open-platforms',
  'add-image',
  'remove-image',
  'reload-images',
  'reorder-images'
]);

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const draggedIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

const editorPlaceholder = computed(() => {
  if (props.synced) return '写点什么...';
  const p = props.enabledPlatforms.find((p: any) => p.value === props.activePlatform);
  return p ? ('正在为 ' + p.label + ' 编写独立文案...') : '写点什么...';
});

// 标题限制检查
const titleLimitInfo = computed(() => {
  if (!props.platformLimitWarnings) return { max: null, exceeded: false };

  const warnings = props.platformLimitWarnings;
  const titleWarning = warnings.find((w) => w.includes('标题'));

  if (!titleWarning) return { max: null, exceeded: false };

  const match = titleWarning.match(/最多\s*(\d+)/);
  const max = match ? parseInt(match[1]) : null;

  return {
    max,
    exceeded: max ? props.title.length > max : false,
  };
});

const titleExceedsLimit = computed(() => titleLimitInfo.value.exceeded);
const titleLimitText = computed(() => {
  if (!titleLimitInfo.value.max) return '字';
  if (titleExceedsLimit.value) {
    return `/ ${titleLimitInfo.value.max} 字 ⚠️超出`;
  }
  return `/ ${titleLimitInfo.value.max} 字`;
});

// 内容限制检查
const contentLimitInfo = computed(() => {
  if (!props.platformLimitWarnings) return { max: null, exceeded: false };

  const warnings = props.platformLimitWarnings;
  const contentWarning = warnings.find((w) => w.includes('正文'));

  if (!contentWarning) return { max: null, exceeded: false };

  const match = contentWarning.match(/最多\s*(\d+)/);
  const max = match ? parseInt(match[1]) : null;

  return {
    max,
    exceeded: max ? props.content.length > max : false,
  };
});

const contentExceedsLimit = computed(() => contentLimitInfo.value.exceeded);
const contentLimitText = computed(() => {
  if (!contentLimitInfo.value.max) return '字';
  if (contentExceedsLimit.value) {
    return `/ ${contentLimitInfo.value.max} 字 ⚠️超出`;
  }
  return `/ ${contentLimitInfo.value.max} 字`;
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

const onTitleInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value;
  emit('update:title', val);
};

const onMediaTypeChange = (e: Event) => {
  emit('update:mediaType', (e.target as HTMLSelectElement).value);
};

const onImageDragStart = (e: DragEvent, index: number) => {
  draggedIndex.value = index;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
  }
};

const onImageDragOver = (e: DragEvent, index: number) => {
  e.preventDefault();
  dragOverIndex.value = index;
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
};

const onImageDrop = (e: DragEvent, targetIndex: number) => {
  e.preventDefault();
  const fromIndex = draggedIndex.value;
  if (fromIndex === null || fromIndex === targetIndex) {
    draggedIndex.value = null;
    dragOverIndex.value = null;
    return;
  }

  // Reorder the images
  const newImageUrls = [...props.imageUrls];
  const [movedImage] = newImageUrls.splice(fromIndex, 1);
  newImageUrls.splice(targetIndex, 0, movedImage);

  emit('update:content', props.content); // Trigger parent update with new order
  emit('reorder-images', { from: fromIndex, to: targetIndex, newOrder: newImageUrls });
};

const onImageDragEnd = () => {
  draggedIndex.value = null;
  dragOverIndex.value = null;
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

.platform-tabs-bar,
.initial-setup-bar {
  height: 56px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid @border-vis;
  background: rgba(255, 255, 255, 0.01);
}

.initial-setup-bar {
  .setup-content {
    display: flex;
    align-items: center;
    gap: 12px;
    color: @muted;
    font-size: 14px;

    .setup-icon {
      font-size: 18px;
    }
  }

  .setup-btn {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: #3f3f46;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    font-size: 18px;
    font-weight: 600;
    color: #e4e4e7;

    &:hover {
      background: @accent;
      color: #fff;
    }
  }
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
  border: none;
  background: #3f3f46;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 13px;
  font-weight: 700;
  color: #e4e4e7;

  &:hover {
    background: #52525b;
  }

  &.active {
    background: #e4e4e7;
    color: #09090b;
  }

  &.more {
    font-size: 12px;
    font-weight: 600;
    color: #e4e4e7;
  }

  &.warning {
    position: relative;
    background: #92400e;

    &:hover {
      background: #b45309;
    }

    .warning-indicator {
      position: absolute;
      top: -4px;
      right: -4px;
      font-size: 12px;
      animation: pulse 2s infinite;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
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

.platform-limit-warning {
  padding: 12px;
  margin: 16px 0;
  border-radius: 8px;
  background: rgba(217, 119, 6, 0.08);
  border: 1px solid rgba(217, 119, 6, 0.2);
  color: #fbbf24;

  .warning-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .warning-icon {
      font-size: 14px;
    }

    .warning-title {
      font-size: 13px;
      font-weight: 600;
    }
  }

  .warning-list {
    margin: 0 0 8px 0;
    padding-left: 20px;
    font-size: 12px;
    color: #fbbf24;

    li {
      margin: 4px 0;
      line-height: 1.4;
    }
  }

  .warning-hint {
    font-size: 11px;
    color: #d97706;
    margin: 0;
    line-height: 1.3;
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

.title-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: @text;
  font-size: 16px;
  font-weight: 600;
  padding: 0 0 12px 0;
  border-bottom: 1px solid @border;
  margin-bottom: 16px;

  &::placeholder { color: #3f3f46; }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    color: #a1a1a6;
  }
}

.input-wrapper {
  position: relative;
  margin-bottom: 12px;
}

.title-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: @text;
  font-size: 16px;
  font-weight: 600;
  padding: 0;
  margin-bottom: 12px;

  &::placeholder {
    color: #3f3f46;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    color: #a1a1a6;
  }
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

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    color: #a1a1a6;
  }
}

.char-counter {
  font-size: 12px;
  color: #71717a;
  text-align: right;
  margin-top: 4px;
  transition: color 0.2s;

  &.over-limit {
    color: #ef4444;
    font-weight: 600;
  }

  &.title-counter {
    margin-bottom: 8px;
  }
}

.draft-image-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  margin: 16px 0;
  background: rgba(251, 146, 60, 0.1);
  border: 1px solid rgba(251, 146, 60, 0.3);
  border-radius: 8px;

  .alert-content {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex: 1;

    .alert-icon {
      font-size: 18px;
      flex-shrink: 0;
    }

    .alert-text {
      flex: 1;

      .alert-title {
        font-size: 13px;
        font-weight: 600;
        color: @text;
      }

      .alert-desc {
        font-size: 12px;
        color: @muted;
        margin-top: 2px;
      }
    }
  }

  .reload-btn {
    background: #fb923c;
    color: #fff;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: background 0.2s;

    &:hover {
      background: #f97316;
    }
  }
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 24px;
}

.media-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 1;
  cursor: grab;
  transition: all 0.2s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:active {
    cursor: grabbing;
  }

  &.dragging {
    opacity: 0.5;
    transform: scale(0.95);
  }

  &.drag-over {
    transform: scale(1.05);
    box-shadow: 0 0 0 2px #3b82f6, 0 0 12px rgba(59, 130, 246, 0.3);
  }
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
