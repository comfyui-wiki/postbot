/**
 * Copyright (c) 2025-2099 GitCoffee All Rights Reserved.
 */
<template>
  <div class="app">
    <!-- 草稿列表栏 -->
    <DraftList
      :drafts="drafts"
      :selectedId="selectedDraftId"
      :getPlatformColor="platformColor"
      :formatTime="formatTime"
      @new-draft="createNewDraft"
      @select="loadDraft"
      @delete="deleteDraft"
      @open-settings="openSettings"
    />

    <!-- 编辑器区域 -->
    <EditorArea
      v-model:content="currentContent"
      v-model:activePlatform="activePlatform"
      v-model:mediaType="localPublish.mediaType"
      :synced="synced"
      :enabledPlatforms="enabledPlatforms"
      :imageUrls="localImageDataUrls"
      :getPlatformColor="platformColor"
      :getPlatformInitial="platformInitial"
      @toggle-sync="toggleSync"
      @publish="triggerPublishNow"
      @schedule="onSchedule"
      @open-platforms="openPlatforms"
      @add-image="onAddImage"
      @remove-image="removeImage"
    />

    <!-- 弹窗组件（Teleport 到 body 避免层叠上下文问题） -->
    <Teleport to="body">
      <PlatformModal
        v-if="showPlatformModal"
        :options="availablePlatformsForModal"
        :selectedCodes="localPublish.platformCodes"
        :getPlatformColor="platformColor"
        :getPlatformInitial="platformInitial"
        @close="closePlatforms"
        @toggle="togglePlatform"
      />
    </Teleport>

    <Teleport to="body">
      <SettingsModal
        v-if="showSettingsModal"
        :loading="metaInfoLoading"
        :successMsg="metaInfoSuccess"
        :errorMsg="metaInfoError"
        :links="loggedInPlatformLinks"
        :getPlatformColor="platformColor"
        :getPlatformInitial="platformInitial"
        @close="closeSettings"
        @detect="loadMetaInfoList"
      />
    </Teleport>

    <input ref="localImageInputRef" type="file" accept="image/*" multiple style="display:none" @change="onLocalImagesSelected" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { POSTBOT_ACTION } from '~message/postbot.action';

// 导入子组件
import DraftList from './drafts/DraftList.vue';
import EditorArea from './editor/EditorArea.vue';
import PlatformModal from './modals/PlatformModal.vue';
import SettingsModal from './modals/SettingsModal.vue';

const STORAGE_KEY = 'postbot_local_publish_state';
const DRAFTS_KEY  = 'postbot_drafts';

// ── 平台元数据 ───────────────────────────────────────────────────────
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

// ── 页面与 UI 状态 ─────────────────────────────────────────────────────────
const showPlatformModal = ref(false);
const showSettingsModal = ref(false);
const activePlatform    = ref<string | null>(null);
const selectedDraftId   = ref<string | null>(null);

// ── 内容同步状态 ──────────────────────────────────────────────────────
const synced           = ref(true);
const platformContents = ref<Record<string, string>>({});

// ── 表单状态 ──────────────────────────────────────────────────────────────
const platformOptions       = ref<{ label: string; value: string; link?: string }[]>([]);
const loggedInPlatformLinks = ref<{ label: string; value: string; link: string }[]>([]);
const localImageInputRef    = ref<HTMLInputElement | null>(null);
const localImageDataUrls    = ref<string[]>([]);

const localPublish = ref({
  mediaType:     'moment' as 'article' | 'moment' | 'video',
  platformCodes: [] as string[],
  title:         '',
  content:       '',
  imageUrls:     '',
});

// ── 草稿历史 ────────────────────────────────────────────────────────────
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

// ── 计算属性 ────────────────────────────────────────────────────────────────
const enabledPlatforms = computed(() => {
  const codes = localPublish.value.platformCodes;
  if (!Array.isArray(codes) || codes.length === 0) return [];

  const options = platformOptions.value;
  if (Array.isArray(options) && options.length > 0) {
    return options.filter((p) => p && p.value && codes.includes(p.value));
  }

  // 检测结果未加载时，用 PLATFORM_META 兜底，保证图标正常显示
  return codes
    .filter((code) => PLATFORM_META[code])
    .map((code) => ({ label: PLATFORM_META[code].label, value: code }));
});

// 用于 PlatformModal 的平台选项（所有已登录或可用的平台）
const availablePlatformsForModal = computed(() => {
  const options = platformOptions.value;
  if (Array.isArray(options) && options.length > 0) {
    return options;
  }

  // 检测结果未加载时，显示所有 PLATFORM_META 里的平台供用户选择
  return Object.entries(PLATFORM_META).map(([code, meta]) => ({
    label: meta.label,
    value: code,
  }));
});

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

// ── 方法 ─────────────────────────────────────────────────────────────────
const onSchedule  = () => { alert('定时发布功能正在开发中，敬请期待！'); };
const onAddImage  = () => { if (localImageInputRef.value) localImageInputRef.value.click(); };
const openSettings   = () => { showSettingsModal.value = true; };
const closeSettings  = () => { showSettingsModal.value = false; };
const openPlatforms  = () => { showPlatformModal.value = true; };
const closePlatforms = () => { showPlatformModal.value = false; };

const togglePlatform = (code: string) => {
  const arr = localPublish.value.platformCodes;
  const idx = arr.indexOf(code);
  if (idx === -1) {
    arr.push(code);
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

const toggleSync = () => {
  if (!synced.value) {
    // 从独立模式切回同步模式：合并所有平台内容到全局
    // （这里简单地选择当前激活平台的内容作为新的全局草稿）
    if (activePlatform.value && platformContents.value[activePlatform.value]) {
      localPublish.value.content = platformContents.value[activePlatform.value];
    }
    platformContents.value = {};
    synced.value = true;
  } else {
    // 从同步模式切到独立模式：给每个平台复制一份当前的全局草稿作为初始内容
    const base = localPublish.value.content;
    const seeded: Record<string, string> = {};
    for (const p of enabledPlatforms.value) {
      // 保留已有的独立内容，或用全局草稿初始化
      seeded[p.value] = platformContents.value[p.value] ?? base;
    }
    platformContents.value = seeded;
    synced.value = false;
  }
};

const removeImage = (index: number) => {
  localImageDataUrls.value.splice(index, 1);
};

// ── 草稿助手 ────────────────────────────────────────────────────────────
const createNewDraft = () => {
  localPublish.value.content = '';
  platformContents.value = {};
  synced.value = true;
  // 保留当前平台选择，activePlatform 若已在列表中则不动，否则取第一个
  if (!localPublish.value.platformCodes.includes(activePlatform.value ?? '')) {
    activePlatform.value = localPublish.value.platformCodes[0] ?? null;
  }
  selectedDraftId.value = null;
};

const deleteDraft = (id: string) => {
  if (!confirm('确定要删除这篇草稿吗？')) return;
  const updated = drafts.value.filter(d => d.id !== id);
  drafts.value = updated;
  chrome.storage.local.set({ [DRAFTS_KEY]: updated });
  if (selectedDraftId.value === id) createNewDraft();
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
  } else {
    updated = [draft, ...drafts.value.slice(0, 49)];
  }
  
  drafts.value = updated;
  chrome.storage.local.set({ [DRAFTS_KEY]: updated });
};

watch(
  [() => localPublish.value.content, () => localPublish.value.platformCodes, synced, platformContents],
  () => {
    if (localPublish.value.content.trim()) saveDraft();
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
  activePlatform.value = d.platformCodes[0] || null;
};

const formatTime = (ts: number) => {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('zh', { month: 'short', day: 'numeric' });
};

// ── 存储 ─────────────────────────────────────────────────────────────────
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
          platformCodes: [...(localPublish.value.platformCodes || [])],
        },
      },
    });
  });
};

onMounted(() => {
  // 优先加载全局检测到的平台
  chrome.storage.local.get(['postbot_detected_platforms', STORAGE_KEY], (result) => {
    const detected = result?.postbot_detected_platforms;
    if (detected && Array.isArray(detected.options)) {
      platformOptions.value = detected.options;
      loggedInPlatformLinks.value = Array.isArray(detected.links) ? detected.links : [];
    } else {
      platformOptions.value = [];
      loggedInPlatformLinks.value = [];
    }

    const raw = result?.[STORAGE_KEY];
    if (!raw || typeof raw !== 'object') return;
    const lastType = raw.lastMediaType;
    const mediaType = (lastType === 'article' || lastType === 'moment' || lastType === 'video')
      ? lastType : localPublish.value.mediaType;
    if (mediaType !== localPublish.value.mediaType) localPublish.value.mediaType = mediaType;

    const forType = raw[mediaType] || raw;
    if (forType && Array.isArray(forType.platformCodes)) {
      localPublish.value.platformCodes = forType.platformCodes;
    } else {
      localPublish.value.platformCodes = [];
    }

    if (!activePlatform.value && Array.isArray(localPublish.value.platformCodes) && localPublish.value.platformCodes.length) {
      activePlatform.value = localPublish.value.platformCodes[0];
    }
  });

  chrome.storage.local.get(DRAFTS_KEY, (result) => {
    if (result && Array.isArray(result[DRAFTS_KEY])) {
      drafts.value = result[DRAFTS_KEY];
    }
  });
});

watch(() => [localPublish.value.mediaType, localPublish.value.platformCodes], () => saveState(), { deep: true });

watch(() => localPublish.value.mediaType, (newType) => {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const raw = result?.[STORAGE_KEY];
    if (!raw || typeof raw !== 'object') return;
    const forType = raw[newType];
    if (forType && Array.isArray(forType.platformCodes)) localPublish.value.platformCodes = forType.platformCodes;
  });
});

// ── 图片处理 ───────────────────────────────────────────────────────────
const onLocalImagesSelected = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const files = input.files;
  if (!files?.length) return;
  const results: string[] = [];
  let completed = 0;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith('image/')) {
      if (++completed === files.length) { localImageDataUrls.value = [...localImageDataUrls.value, ...results]; input.value = ''; }
      continue;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) results.push(reader.result as string);
      if (++completed === files.length) { localImageDataUrls.value = [...localImageDataUrls.value, ...results]; input.value = ''; }
    };
    reader.readAsDataURL(file);
  }
};

// ── 网络 ──────────────────────────────────────────────────────────────────
const metaInfoLoading = ref(false);
const metaInfoError   = ref('');
const metaInfoSuccess = ref('');

const sendToBackground = (payload: { type: string; action: string; data?: unknown }) =>
  new Promise((resolve, reject) => {
    // 设置 10 秒超时
    const timeout = setTimeout(() => {
      reject(new Error('请求超时，请检查后台脚本是否正常运行'));
    }, 10000);

    chrome.runtime.sendMessage(payload, (response: unknown) => {
      clearTimeout(timeout);
      if (chrome.runtime.lastError) { 
        reject(new Error(chrome.runtime.lastError.message)); 
        return; 
      }
      resolve(response);
    });
  });

const loadMetaInfoList = async () => {
  console.log('[PostBot] 开始检测账号...');
  metaInfoError.value = ''; 
  metaInfoSuccess.value = ''; 
  metaInfoLoading.value = true;
  
  try {
    const response = (await sendToBackground({ 
      type: 'request', 
      action: POSTBOT_ACTION.META_INFO_LIST 
    })) as { metaInfoList?: Record<string, any>; error?: string };
    
    console.log('[PostBot] 收到元数据响应:', response);
    
    if (response?.error) throw new Error(response.error);
    
    const list = response?.metaInfoList ?? {};
    const loggedInCodes = Object.keys(list);
    console.log('[PostBot] 已登录平台代码:', loggedInCodes);
    
    if (loggedInCodes.length > 0) {
      let options: { label: string; value: string; link?: string }[] = [];
      
      try {
        const platformRes = (await sendToBackground({ 
          type: 'request', 
          action: POSTBOT_ACTION.PLATFORM_LIST, 
          data: { type: localPublish.value.mediaType } 
        })) as { platforms?: any; error?: string };
        
        console.log('[PostBot] 收到平台列表响应:', platformRes);
        
        const raw = platformRes?.platforms ?? [];
        const allPlatforms = Array.isArray(raw) ? raw : Object.values(raw || {});
        
        const platformMap: Record<string, any> = {};
        allPlatforms.forEach((p: any) => { 
          if (p.code) platformMap[p.code] = p; 
        });

        options = loggedInCodes.map(code => {
          const p = platformMap[code];
          return {
            label: p?.platformName || p?.name || PLATFORM_META[code]?.label || code,
            value: code,
            link: p?.homepage || p?.site || '#'
          };
        });
      } catch (err) {
        console.warn('[PostBot] 获取平台详情失败:', err);
        options = loggedInCodes.map((code) => ({ 
          label: PLATFORM_META[code]?.label || code, 
          value: code, 
          link: '#' 
        }));
      }
      
      console.log('[PostBot] 生成的平台选项:', options);
      
      // 确保 options 始终是数组
      platformOptions.value = Array.isArray(options) ? options : [];
      loggedInPlatformLinks.value = platformOptions.value.map((o) => ({ 
        label: o.label, 
        value: o.value, 
        link: o.link || '#' 
      }));
      
      chrome.storage.local.set({ 
        'postbot_detected_platforms': { 
          options: platformOptions.value, 
          links: loggedInPlatformLinks.value, 
          lastDetected: Date.now() 
        } 
      });
      
      if (Array.isArray(localPublish.value.platformCodes) && localPublish.value.platformCodes.length === 0) {
        localPublish.value.platformCodes = platformOptions.value.map((o) => o.value);
      }
      
      if (!activePlatform.value && platformOptions.value.length) {
        activePlatform.value = platformOptions.value[0].value;
      }
      
      saveState();
      metaInfoSuccess.value = `检测成功！已发现 ${loggedInCodes.length} 个登录账号。`;
    } else {
      console.log('[PostBot] 未发现已登录平台');
      metaInfoSuccess.value = '';
      metaInfoError.value = '未检测到已登录账号。请先在浏览器中登录微博、知乎或小红书等平台，然后再次点击检测。';
    }
  } catch (e) {
    console.error('[PostBot] 检测失败:', e);
    metaInfoError.value = '检测过程出错：' + (e instanceof Error ? e.message : String(e));
  } finally {
    metaInfoLoading.value = false;
  }
};

const triggerPublishNow = () => {
  const { mediaType, platformCodes, title, imageUrls } = localPublish.value;
  if (!Array.isArray(platformCodes) || !platformCodes.length) return;
  
  if (!confirm(`确定要发布到已选的 ${platformCodes.length} 个平台吗？`)) return;

  let validCodes = platformCodes;
  if (Array.isArray(platformOptions.value) && platformOptions.value.length > 0) {
    validCodes = platformCodes.filter((code) => 
      platformOptions.value.some((o) => o && o.value === code)
    );
  }
  
  if (!validCodes.length) return;
  const urls = [...(imageUrls || '').split(/[\r\n]+/).map((s) => s.trim()).filter(Boolean), ...localImageDataUrls.value];
  const contentImages = urls.map((src) => ({ src }));
  const cover = urls.length ? urls : undefined;

  if (!synced.value) {
    for (const code of validCodes) {
      const content = platformContents.value[code] ?? localPublish.value.content;
      chrome.runtime.sendMessage({ type: 'request', action: POSTBOT_ACTION.PUBLISH_NOW, data: { mediaType, platformCodes: [code], title, content, contentImages: contentImages.length ? contentImages : undefined, images: contentImages.length ? contentImages : undefined, cover, isAutoPublish: false } });
    }
  } else {
    chrome.runtime.sendMessage({ type: 'request', action: POSTBOT_ACTION.PUBLISH_NOW, data: { mediaType, platformCodes: validCodes, title, content: localPublish.value.content, contentImages: contentImages.length ? contentImages : undefined, images: contentImages.length ? contentImages : undefined, cover, isAutoPublish: false } });
  }
  saveDraft();
};
</script>

<style lang="less" scoped>
:global(body) { margin: 0; padding: 0; }
@bg: #09090b;
@text: #f4f4f5;

.app {
  display: flex;
  height: 100vh;
  background: @bg;
  color: @text;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
}
</style>
