/**
 * Copyright (c) 2025-2099 GitCoffee All Rights Reserved.
 */
<template>
  <div class="app">

    <!-- ══════════════════════════════════════════
         MIDDLE COLUMN: DRAFTS LIST & NAV
    ══════════════════════════════════════════ -->
    <div class="middle-col">
      <div class="middle-header">
        <div class="middle-top-row">
          <span class="title">草稿箱</span>
          <div class="middle-header-actions">
            <button class="icon-btn" @click="showSettingsModal = true" title="设置">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        </div>
        <button class="new-draft-btn" @click="createNewDraft">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          新建草稿
        </button>
      </div>
      <div class="drafts-list">
        <div v-if="!drafts.length" class="drafts-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <p>暂无草稿</p>
          <span>开始创作你的第一篇内容吧</span>
        </div>
        <div
          v-for="d in drafts"
          :key="d.id"
          class="draft-card"
          :class="{ active: selectedDraftId === d.id }"
          @click="loadDraft(d)"
        >
          <div class="draft-card-header">
            <div class="draft-card-content">{{ d.content || '无标题草稿' }}</div>
            <button class="delete-draft-btn" @click="deleteDraft(d.id, $event)" title="删除草稿">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
          <div class="draft-card-footer">
            <div class="draft-card-platforms">
              <span v-for="code in d.platformCodes" :key="code" class="mini-dot" :style="{ background: platformColor(code) }"></span>
            </div>
            <span class="draft-card-time">{{ formatTime(d.time) }}</span>
          </div>
        </div>
      </div>
      <div class="middle-footer">
        <button class="detect-accounts-btn" @click="showSettingsModal = true">
          账号检测
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════
         RIGHT COLUMN: EDITOR AREA
    ══════════════════════════════════════════ -->
    <div class="main">
      <!-- Top bar with Publish/Schedule -->
      <div class="top-bar">
        <div class="top-bar-left">
          <div class="publish-on-hint" v-if="enabledPlatforms.length">
            发布至 
            <span v-for="p in enabledPlatforms" :key="p.value" class="mini-p-icon" :style="{ background: platformColor(p.value) }">
              {{ platformInitial(p.value) }}
            </span>
          </div>
        </div>
        <div class="top-bar-right">
          <div class="sync-toggle" :class="{ active: synced }" @click="toggleSync" title="同步所有平台文案">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
            <span>同步</span>
          </div>
          <button class="schedule-btn" @click="confirm('定时发布功能正在开发中，敬请期待！')">定时发布</button>
          <button class="publish-btn" @click="triggerPublishNow" :disabled="!enabledPlatforms.length">立即发布</button>
          <button class="p-settings-btn" @click="showPlatformModal = true" title="选择发布平台">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Editor Canvas -->
      <div class="editor-canvas">
        <div class="editor-container">
          <!-- Platform Switcher (Horizontal tabs style) -->
          <div class="editor-platform-tabs" v-if="!synced && enabledPlatforms.length > 1">
            <button 
              v-for="p in enabledPlatforms" 
              :key="p.value"
              class="platform-tab"
              :class="{ active: activePlatform === p.value }"
              @click="activePlatform = p.value"
            >
              <span class="p-dot sm" :style="{ background: platformColor(p.value) }">{{ platformInitial(p.value) }}</span>
              {{ p.label }}
            </button>
          </div>

          <div class="writing-area">
            <div class="author-info" v-if="activePlatform">
              <div class="p-dot" :style="{ background: platformColor(activePlatform) }">{{ platformInitial(activePlatform) }}</div>
              <div class="author-details">
                <div class="author-name">{{ enabledPlatforms.find(p => p.value === activePlatform)?.label || 'PostBot' }}</div>
                <div class="author-handle">@postbot</div>
              </div>
            </div>

            <textarea
              ref="textareaRef"
              class="main-editor"
              v-model="currentContent"
              :placeholder="synced ? '写点什么...' : `正在为 ${enabledPlatforms.find(p => p.value === activePlatform)?.label} 编写独立文案...`"
              @input="autoResize"
            />

            <!-- Media Previews -->
            <div class="media-grid" v-if="localImageDataUrls.length">
              <div class="media-item" v-for="(url, i) in localImageDataUrls" :key="i">
                <img :src="url" />
                <button class="media-remove" @click="removeImage(i)">✕</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Floating Toolbar -->
      <div class="floating-toolbar">
        <button class="float-btn" @click="localImageInputRef?.click()" title="添加图片">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>
        <div class="v-divider"></div>
        <select class="type-select" v-model="localPublish.mediaType">
          <option value="moment">动态</option>
          <option value="article">文章</option>
          <option value="video">视频</option>
        </select>
        <div class="v-divider"></div>
        <div class="char-count">{{ currentContent.length }} 字</div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════
         MODALS (Centered)
    ══════════════════════════════════════════ -->
    <div class="overlay centered" v-if="showPlatformModal" @click.self="showPlatformModal = false">
      <div class="modal centered-modal">
        <div class="modal-header">
          <span class="modal-title">发布平台</span>
          <button class="modal-close" @click="showPlatformModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-subtitle">选择要发布此草稿的平台。</p>
          <div class="platform-list">
            <div v-for="p in platformOptions" :key="p.value" class="platform-row" @click="togglePlatform(p.value)">
              <div class="platform-row-left">
                <div class="p-dot" :style="{ background: platformColor(p.value) }">{{ platformInitial(p.value) }}</div>
                <div class="platform-row-info">
                  <div class="name">{{ p.label }}</div>
                  <div class="handle">@已登录账号</div>
                </div>
              </div>
              <div class="platform-row-right">
                <div class="toggle-switch" :class="{ on: localPublish.platformCodes.includes(p.value) }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Modal (Centered) -->
    <div class="overlay centered" v-if="showSettingsModal" @click.self="showSettingsModal = false">
      <div class="modal centered-modal">
        <div class="modal-header">
          <span class="modal-title">设置与账号</span>
          <button class="modal-close" @click="showSettingsModal = false">✕</button>
        </div>
        <div class="modal-body settings-body">
          <button class="detect-btn-large" :disabled="metaInfoLoading" @click="loadMetaInfoList">
            {{ metaInfoLoading ? '检测中...' : '检测已登录账号' }}
          </button>
          <div v-if="metaInfoSuccess" class="detect-msg success">{{ metaInfoSuccess }}</div>
          <div v-if="metaInfoError" class="detect-msg error">{{ metaInfoError }}</div>
          
          <div class="account-links">
            <a v-for="item in loggedInPlatformLinks" :key="item.value" :href="item.link" target="_blank" class="account-link">
              <span class="p-dot sm" :style="{ background: platformColor(item.value) }">{{ platformInitial(item.value) }}</span>
              <span>{{ item.label }}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </div>
        </div>
      </div>
    </div>

    <input ref="localImageInputRef" type="file" accept="image/*" multiple style="display:none" @change="onLocalImagesSelected" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { POSTBOT_ACTION } from '~message/postbot.action';

const STORAGE_KEY = 'postbot_local_publish_state';
const DRAFTS_KEY  = 'postbot_drafts';

// ── Platform metadata ───────────────────────────────────────────────────────
const PLATFORM_META: Record<string, { color: string; initial: string; label: string }> = {
  bilibili:        { color: '#00A1D6', initial: 'B', label: 'Bilibili' },
  xiaohongshu:     { color: '#FF2442', initial: '红', label: '小红书' },
  weibo:           { color: '#E6162D', initial: '微', label: '微博' },
  douyin:          { color: '#161823', initial: '抖', label: '抖音' },
  weixin:          { color: '#07C160', initial: '信', label: '微信公众号' },
  weixin_channels: { color: '#07C160', initial: '视', label: '视频号' },
  zhihu:           { color: '#0084FF', initial: '知', label: '知乎' },
  toutiao:         { color: '#FE5B22', initial: '头', label: '今日头条' },
  baijiahao:       { color: '#2932E1', initial: '百', label: '百家号' },
  kuaishou:        { color: '#FF4906', initial: '快', label: '快手' },
  douban:          { color: '#007722', initial: '豆', label: '豆瓣' },
  jianshu:         { color: '#EA6F5A', initial: '简', label: '简书' },
  zsxq:            { color: '#FFC300', initial: '星', label: '知识星球' },
  qq_om:           { color: '#1B6EF3', initial: 'Q', label: '腾讯企鹅号' },
};

const platformColor   = (code: string) => PLATFORM_META[code]?.color   ?? '#6366f1';
const platformInitial = (code: string) => PLATFORM_META[code]?.initial ?? code.charAt(0).toUpperCase();

// ── Page / UI state ─────────────────────────────────────────────────────────
const page              = ref<'compose' | 'drafts'>('compose');
const showPlatformModal = ref(false);
const showSettingsModal = ref(false);
const activePlatform    = ref<string | null>(null);
const selectedDraftId   = ref<string | null>(null);

const selectedDraft = computed(() => 
  drafts.value.find(d => d.id === selectedDraftId.value)
);

const selectDraft = (d: Draft) => {
  selectedDraftId.value = d.id;
};

// ── Content sync state ──────────────────────────────────────────────────────
/** true = all platforms share one content; false = per-platform content */
const synced           = ref(true);
const platformContents = ref<Record<string, string>>({});

// ── Form state ──────────────────────────────────────────────────────────────
const platformOptions       = ref<{ label: string; value: string; link?: string }[]>([]);
const loggedInPlatformLinks = ref<{ label: string; value: string; link: string }[]>([]);
const localImageInputRef    = ref<HTMLInputElement | null>(null);
const localImageDataUrls    = ref<string[]>([]);
const textareaRef           = ref<HTMLTextAreaElement | null>(null);

const localPublish = ref({
  mediaType:     'moment' as 'article' | 'moment' | 'video',
  platformCodes: [] as string[],
  title:         '',
  content:       '',
  imageUrls:     '',
});

// ── Draft history ────────────────────────────────────────────────────────────
type Draft = { 
  id: string; 
  content: string; 
  time: number; 
  platforms: string[]; 
  platformCodes: string[];
  platformData?: Record<string, string>;
  isSynced?: boolean;
};
const drafts = ref<Draft[]>([]);

// ── Computed ────────────────────────────────────────────────────────────────
const enabledPlatforms = computed(() =>
  platformOptions.value.filter((p) => localPublish.value.platformCodes.includes(p.value))
);

/**
 * Two-way binding for the textarea content.
 * When synced: reads/writes localPublish.content (shared for all platforms).
 * When unsynced: reads/writes platformContents[activePlatform] (per-platform).
 */
const currentContent = computed<string>({
  get() {
    if (synced.value || !activePlatform.value) return localPublish.value.content;
    return platformContents.value[activePlatform.value] ?? localPublish.value.content;
  },
  set(val: string) {
    if (synced.value || !activePlatform.value) {
      localPublish.value.content = val;
    } else {
      platformContents.value = { ...platformContents.value, [activePlatform.value]: val };
    }
  },
});

// ── Methods ─────────────────────────────────────────────────────────────────
const togglePlatform = (code: string) => {
  const arr = localPublish.value.platformCodes;
  const idx = arr.indexOf(code);
  if (idx === -1) {
    arr.push(code);
    // Pre-fill per-platform content with current shared content
    if (!platformContents.value[code]) {
      platformContents.value = { ...platformContents.value, [code]: localPublish.value.content };
    }
    if (!activePlatform.value) activePlatform.value = code;
  } else {
    arr.splice(idx, 1);
    if (activePlatform.value === code) {
      activePlatform.value = arr[0] ?? null;
    }
  }
};

/** Switch sync mode */
const toggleSync = () => {
  if (!synced.value) {
    // Switching back to synced: use the active platform's content as base (or keep current)
    if (activePlatform.value && platformContents.value[activePlatform.value]) {
      localPublish.value.content = platformContents.value[activePlatform.value];
    }
    synced.value = true;
  } else {
    // Switching to unsynced: seed per-platform content from shared content
    const base = localPublish.value.content;
    const seeded: Record<string, string> = {};
    for (const p of enabledPlatforms.value) {
      seeded[p.value] = platformContents.value[p.value] ?? base;
    }
    platformContents.value = seeded;
    synced.value = false;
  }
};

const removeImage = (index: number) => {
  localImageDataUrls.value.splice(index, 1);
};

const autoResize = () => {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
};

// Re-resize when switching active platform (content length may differ)
watch(activePlatform, () => { nextTick(autoResize); });

// ── Draft helpers ────────────────────────────────────────────────────────────
const createNewDraft = () => {
  // 重置编辑器状态，不带 ID
  localPublish.value.content = '';
  localPublish.value.platformCodes = [];
  platformContents.value = {};
  synced.value = true;
  activePlatform.value = null;
  selectedDraftId.value = null; // 关键：清空 ID
  nextTick(autoResize);
};

const deleteDraft = (id: string, event?: Event) => {
  event?.stopPropagation();
  if (!confirm('确定要删除这篇草稿吗？')) return;
  
  const updated = drafts.value.filter(d => d.id !== id);
  drafts.value = updated;
  chrome.storage.local.set({ [DRAFTS_KEY]: updated });
  
  if (selectedDraftId.value === id) {
    createNewDraft();
  }
};

const saveDraft = () => {
  const content = localPublish.value.content.trim();
  if (!content) return;
  
  const platformData: Record<string, string> = {};
  if (!synced.value) {
    for (const code of localPublish.value.platformCodes) {
      platformData[code] = platformContents.value[code] || content;
    }
  }

  // 如果 selectedDraftId 为空，则分配一个新 ID
  if (!selectedDraftId.value) {
    selectedDraftId.value = Date.now().toString();
  }
  
  const draft: Draft = {
    id: selectedDraftId.value,
    content,
    time: Date.now(),
    platforms: enabledPlatforms.value.map((p) => p.label),
    platformCodes: [...localPublish.value.platformCodes],
    platformData,
    isSynced: synced.value
  };

  const existingIndex = drafts.value.findIndex(d => d.id === selectedDraftId.value);
  let updated: Draft[] = [...drafts.value];
  
  if (existingIndex > -1) {
    updated[existingIndex] = draft;
    // 将正在编辑的草稿置顶
    const [item] = updated.splice(existingIndex, 1);
    updated.unshift(item);
  } else {
    updated = [draft, ...drafts.value.slice(0, 49)];
  }
  
  drafts.value = updated;
  chrome.storage.local.set({ [DRAFTS_KEY]: updated });
};

// 监听内容变化，实现自动保存
watch(
  [() => localPublish.value.content, () => localPublish.value.platformCodes, synced, platformContents],
  () => {
    // 只有当有内容时才自动保存
    if (localPublish.value.content.trim()) {
      saveDraft();
    }
  },
  { deep: true }
);

const loadDraft = (d: Draft) => {
  selectedDraftId.value = d.id;
  localPublish.value.content = d.content;
  localPublish.value.platformCodes = [...d.platformCodes];
  
  if (d.platformData && !d.isSynced) {
    platformContents.value = { ...d.platformData };
    synced.value = false;
  } else {
    synced.value = true;
  }
  
  if (d.platformCodes.length > 0) {
    activePlatform.value = d.platformCodes[0];
  } else {
    activePlatform.value = null;
  }
  
  nextTick(autoResize);
};

const clearDrafts = () => {
  drafts.value = [];
  chrome.storage.local.remove(DRAFTS_KEY);
};

const formatTime = (ts: number) => {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('zh', { month: 'short', day: 'numeric' });
};

// ── Storage ─────────────────────────────────────────────────────────────────
const saveState = () => {
  const mediaType = localPublish.value.mediaType;
  chrome.storage.local.get(STORAGE_KEY, (prev) => {
    const prevState = prev?.[STORAGE_KEY] && typeof prev[STORAGE_KEY] === 'object' ? prev[STORAGE_KEY] : {};
    chrome.storage.local.set({
      [STORAGE_KEY]: {
        ...prevState,
        lastMediaType: mediaType,
        [mediaType]: {
          mediaType,
          platformCodes:       [...(localPublish.value.platformCodes || [])],
          platformOptions:     platformOptions.value?.length ? platformOptions.value : undefined,
          loggedInPlatformLinks: loggedInPlatformLinks.value?.length ? loggedInPlatformLinks.value : undefined,
        },
      },
    });
  });
};

onMounted(() => {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const raw = result?.[STORAGE_KEY];
    if (!raw || typeof raw !== 'object') return;
    const lastType = raw.lastMediaType;
    const mediaType = (lastType === 'article' || lastType === 'moment' || lastType === 'video')
      ? lastType : localPublish.value.mediaType;
    if (mediaType !== localPublish.value.mediaType) localPublish.value.mediaType = mediaType;
    const forType = raw[mediaType] || raw;
    if (Array.isArray(forType.platformCodes)) localPublish.value.platformCodes = forType.platformCodes;
    if (Array.isArray(forType.platformOptions) && forType.platformOptions.length > 0) {
      platformOptions.value = forType.platformOptions.map((o: { label?: string; value?: string; link?: string }) => ({
        label: o.label ?? '', value: o.value ?? '', link: o.link,
      }));
    }
    if (Array.isArray(forType.loggedInPlatformLinks) && forType.loggedInPlatformLinks.length > 0) {
      loggedInPlatformLinks.value = forType.loggedInPlatformLinks.map(
        (o: { label?: string; value?: string; link?: string }) => ({
          label: o.label ?? '', value: o.value ?? '', link: o.link ?? '#',
        })
      );
    }
    if (!activePlatform.value && localPublish.value.platformCodes.length) {
      activePlatform.value = localPublish.value.platformCodes[0];
    }
  });

  chrome.storage.local.get(DRAFTS_KEY, (result) => {
    if (Array.isArray(result[DRAFTS_KEY])) drafts.value = result[DRAFTS_KEY];
  });
});

watch(
  () => [localPublish.value.mediaType, localPublish.value.platformCodes, platformOptions.value],
  () => { saveState(); },
  { deep: true }
);

watch(
  () => localPublish.value.mediaType,
  (newType) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const raw = result?.[STORAGE_KEY];
      if (!raw || typeof raw !== 'object') return;
      const forType = raw[newType];
      if (!forType) return;
      if (Array.isArray(forType.platformCodes)) localPublish.value.platformCodes = forType.platformCodes;
      if (Array.isArray(forType.platformOptions) && forType.platformOptions.length > 0) {
        platformOptions.value = forType.platformOptions.map((o: { label?: string; value?: string; link?: string }) => ({
          label: o.label ?? '', value: o.value ?? '', link: o.link,
        }));
      } else {
        platformOptions.value = [];
      }
    });
  }
);

// ── Image handling ───────────────────────────────────────────────────────────
const onLocalImagesSelected = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const files = input.files;
  if (!files?.length) return;
  const results: string[] = [];
  let completed = 0;
  const total = files.length;
  for (let i = 0; i < total; i++) {
    const file = files[i];
    if (!file.type.startsWith('image/')) {
      if (++completed === total) { localImageDataUrls.value = [...localImageDataUrls.value, ...results]; input.value = ''; }
      continue;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) results.push(reader.result as string);
      if (++completed === total) { localImageDataUrls.value = [...localImageDataUrls.value, ...results]; input.value = ''; }
    };
    reader.readAsDataURL(file);
  }
};

// ── Network ──────────────────────────────────────────────────────────────────
const metaInfoLoading = ref(false);
const metaInfoError   = ref('');
const metaInfoSuccess = ref('');

const sendToBackground = (payload: { type: string; action: string; data?: unknown }) =>
  new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(payload, (response: unknown) => {
      if (chrome.runtime.lastError) { reject(new Error(chrome.runtime.lastError.message)); return; }
      resolve(response);
    });
  });

const loadMetaInfoList = async () => {
  metaInfoError.value = '';  metaInfoSuccess.value = '';  loggedInPlatformLinks.value = [];
  metaInfoLoading.value = true;
  try {
    const response = (await sendToBackground({ type: 'request', action: POSTBOT_ACTION.META_INFO_LIST })) as { metaInfoList?: Record<string, unknown>; error?: string };
    if (response?.error) throw new Error(response.error);
    const list = response?.metaInfoList ?? {};
    const loggedInCodes = typeof list === 'object' && list !== null ? Object.keys(list) : [];
    if (loggedInCodes.length > 0) {
      let options: { label: string; value: string; link?: string }[];
      try {
        const platformRes = (await sendToBackground({ type: 'request', action: POSTBOT_ACTION.PLATFORM_LIST, data: { type: localPublish.value.mediaType } })) as { platforms?: Array<{ code?: string; platformName?: string; homepage?: string; site?: string }>; error?: string };
        const raw = platformRes?.platforms ?? [];
        const all = Array.isArray(raw) ? raw : Object.values(raw || {});
        options = all
          .filter((p: { code?: string }) => loggedInCodes.includes(p?.code ?? ''))
          .map((p: { code?: string; platformName?: string; homepage?: string; site?: string }) => ({
            label: p.platformName || p.code || '', value: p.code || '', link: p.homepage || p.site || '#',
          }));
      } catch (_) {
        options = loggedInCodes.map((code) => ({ label: code, value: code, link: '#' }));
      }
      platformOptions.value = options;
      loggedInPlatformLinks.value = options.map((o) => ({ ...o, link: o.link || '#' }));
      localPublish.value.platformCodes = options.map((o) => o.value);
      if (!activePlatform.value && options.length) activePlatform.value = options[0].value;
      saveState();
      metaInfoSuccess.value = `已检测到 ${loggedInCodes.length} 个已登录平台`;
    } else {
      metaInfoSuccess.value = '未检测到已登录平台。请先在浏览器中打开并登录目标平台，再重新检测。';
    }
  } catch (e) {
    metaInfoError.value = e instanceof Error ? e.message : String(e);
    console.error('[PostBot] 获取平台登录信息失败', e);
  } finally {
    metaInfoLoading.value = false;
  }
};

const triggerPublishNow = () => {
  const { mediaType, platformCodes, title, imageUrls } = localPublish.value;
  if (!platformCodes?.length) return;
  
  if (!confirm(`确定要发布到已选的 ${platformCodes.length} 个平台吗？`)) return;

  const validCodes = platformOptions.value?.length
    ? platformCodes.filter((code) => platformOptions.value.some((o) => o.value === code))
    : platformCodes;
  if (!validCodes.length) return;

  const urlLines = (imageUrls || '').split(/[\r\n]+/).map((s) => s.trim()).filter(Boolean);
  const urls = [...urlLines, ...localImageDataUrls.value];
  const contentImages = urls.map((src) => ({ src }));
  const cover = urls.length ? urls : undefined;

  if (!synced.value) {
    // Per-platform: send one message per platform with its own content
    for (const code of validCodes) {
      const content = platformContents.value[code] ?? localPublish.value.content;
      chrome.runtime.sendMessage({
        type: 'request', action: POSTBOT_ACTION.PUBLISH_NOW,
        data: { mediaType, platformCodes: [code], title, content,
          contentImages: contentImages.length ? contentImages : undefined,
          images: contentImages.length ? contentImages : undefined, cover, isAutoPublish: false },
      }, () => {});
    }
  } else {
    // Synced: send all platforms with shared content
    chrome.runtime.sendMessage({
      type: 'request', action: POSTBOT_ACTION.PUBLISH_NOW,
      data: { mediaType, platformCodes: validCodes, title, content: localPublish.value.content,
        contentImages: contentImages.length ? contentImages : undefined,
        images: contentImages.length ? contentImages : undefined, cover, isAutoPublish: false },
    }, () => {});
  }

  saveDraft();
};
</script>

<style lang="less" scoped>
:global(body) { margin: 0; padding: 0; }

// ── Design tokens ──────────────────────────────────────────────────────────
@bg:           #09090b;
@surface:      #18181b;
@border:       rgba(255, 255, 255, 0.06);
@border-vis:   #27272a;
@text:         #f4f4f5;
@muted:        #71717a;
@accent:       #3b82f6;
@accent-hover: #2563eb;
@radius:       12px;

* { box-sizing: border-box; }

.app {
  display: flex;
  height: 100vh;
  background: @bg;
  color: @text;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
}

// ── Middle Col (Drafts) ────────────────────────────────────────────────────
.middle-col {
  width: 280px;
  border-right: 1px solid @border-vis;
  display: flex;
  flex-direction: column;
  background: rgba(255,255,255,0.01);
}

.middle-header {
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  .middle-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .title { font-size: 18px; font-weight: 700; }
}

.icon-btn {
  background: transparent;
  border: none;
  color: @muted;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: @text;
  }
}

.new-draft-btn {
  background: @surface;
  border: 1px solid @border;
  color: @text;
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #27272a; }
}

.drafts-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.drafts-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: @muted;
  text-align: center;
  svg { margin-bottom: 16px; opacity: 0.3; }
  p { font-size: 14px; font-weight: 600; color: @text; margin: 0 0 4px; }
  span { font-size: 12px; opacity: 0.7; }
}

.middle-footer {
  padding: 16px;
  border-top: 1px solid @border-vis;
}

.detect-accounts-btn {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid @border-vis;
  border-radius: 8px;
  color: @text;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: @muted;
  }
}

.draft-card {
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid transparent;
  position: relative;
  &:hover { 
    background: rgba(255, 255, 255, 0.04); 
    border-color: @border;
    transform: translateY(-1px);
    .delete-draft-btn { opacity: 1; }
  }
  &.active { 
    background: rgba(59, 130, 246, 0.08); 
    border-color: rgba(59, 130, 246, 0.2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.draft-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.delete-draft-btn {
  opacity: 0;
  background: transparent;
  border: none;
  color: @muted;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
  &:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }
}

.draft-card-content {
  font-size: 14px;
  line-height: 1.5;
  color: @text;
  font-weight: 500;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 12px;
  flex: 1;
}

.draft-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.draft-card-platforms { display: flex; gap: 4px; }
.mini-dot { width: 6px; height: 6px; border-radius: 50%; }
.draft-card-time { font-size: 11px; color: @muted; }

// ── Main Editor Area ───────────────────────────────────────────────────────
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

// ── Editor Canvas ──────────────────────────────────────────────────────────
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

.writing-area {
  background: transparent;
}

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

// ── Floating Toolbar ───────────────────────────────────────────────────────
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

// ── Modals (Centered) ──────────────────────────────────────────────────────
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

.detect-btn-large {
  width: 100%; padding: 12px; border-radius: 12px; background: @accent; color: #fff;
  border: none; font-weight: 600; cursor: pointer; margin-bottom: 16px;
}

.account-links { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
.account-link {
  display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 8px;
  background: rgba(255,255,255,0.03); text-decoration: none; color: @text; font-size: 13px;
  &:hover { background: rgba(255,255,255,0.05); }
}

.p-dot {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 50%; font-size: 11px; font-weight: 700; color: #fff;
  &.sm { width: 20px; height: 20px; font-size: 8px; }
}
</style>
