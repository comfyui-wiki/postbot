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
    />

    <!-- 编辑器区域 -->
    <EditorArea
      v-model:content="currentContent"
      v-model:title="currentTitle"
      v-model:activePlatform="activePlatform"
      v-model:mediaType="localPublish.mediaType"
      :synced="activePlatform !== localPublish.platformCodes[0] && platformSyncStatus[activePlatform || ''] !== false"
      :enabledPlatforms="enabledPlatforms"
      :imageUrls="currentImages"
      :isFirstPlatform="activePlatform === localPublish.platformCodes[0]"
      :activePlatformNeedsTitle="PLATFORM_META[activePlatform || '']?.needsTitle ?? false"
      :draftImageMetadata="selectedDraftImageMetadata"
      :platformLimitWarnings="platformLimitWarnings"
      :platformLimitStatus="platformLimitStatus"
      :getPlatformColor="platformColor"
      :getPlatformInitial="platformInitial"
      @toggle-sync="toggleSync"
      @publish="triggerPublishNow"
      @open-platforms="openPlatforms"
      @add-image="onAddImage"
      @remove-image="removeImage"
      @reload-images="quickReloadImages"
      @reorder-images="reorderImages"
    />

    <!-- 弹窗组件（Teleport 到 body 避免层叠上下文问题） -->
    <Teleport to="body">
      <PlatformModal
        v-if="showPlatformModal"
        :options="availablePlatformsForModal"
        :selectedCodes="localPublish.platformCodes"
        :loggedInCodes="loggedInPlatformCodes"
        :hasDetected="hasDetectedPlatforms"
        :detecting="metaInfoLoading"
        :getPlatformColor="platformColor"
        :getPlatformInitial="platformInitial"
        @close="closePlatforms"
        @toggle="togglePlatform"
        @detect="loadMetaInfoList"
      />
    </Teleport>

    <input ref="localImageInputRef" type="file" accept="image/*" multiple style="display:none" @change="onLocalImagesSelected" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { POSTBOT_ACTION } from '~message/postbot.action';
import { getImageMetadata, fileToDataUrl, isImageMatch } from '~utils/imageStorage';
import { saveImageBlob, getImageBlobs, deleteAllImageBlobs, fileToDataUrl as dbFileToDataUrl } from '~utils/imageDatabase';
import { hasPlatformLimitViolation, checkPlatformLimits, getPlatformLimits } from '~config/platform-limits';

// 导入子组件
import DraftList from './drafts/DraftList.vue';
import EditorArea from './editor/EditorArea.vue';
import PlatformModal from './modals/PlatformModal.vue';

const STORAGE_KEY = 'postbot_local_publish_state';
const DRAFTS_KEY  = 'postbot_drafts';

// ── 平台元数据 ───────────────────────────────────────────────────────
const PLATFORM_META: Record<string, { color: string; initial: string; label: string; needsTitle?: boolean }> = {
  juejin:          { color: '#1E80FF', initial: '掘', label: '稀土掘金', needsTitle: true },
  csdn:            { color: '#FFA500', initial: 'C', label: 'CSDN', needsTitle: true },
  bilibili:        { color: '#00A1D6', initial: 'B', label: 'Bilibili', needsTitle: true },
  xiaohongshu:     { color: '#FF2442', initial: '红', label: '小红书', needsTitle: true },
  weibo:           { color: '#E6162D', initial: '微', label: '微博' },
  douyin:          { color: '#161823', initial: '抖', label: '抖音' },
  weixin:          { color: '#07C160', initial: '信', label: '微信公众号' },
  weixin_channels: { color: '#07C160', initial: '视', label: '视频号' },
  zhihu:           { color: '#0084FF', initial: '知', label: '知乎', needsTitle: true },
  toutiao:         { color: '#FE5B22', initial: '头', label: '今日头条' },
  baijiahao:       { color: '#2932E1', initial: '百', label: '百家号' },
  kuaishou:        { color: '#FF4906', initial: '快', label: '快手' },
  douban:          { color: '#007722', initial: '豆', label: '豆瓣' },
  jianshu:         { color: '#EA6F5A', initial: '简', label: '简书' },
  zsxq:            { color: '#FFC300', initial: '星', label: '知识星球' },
  qq_om:           { color: '#1B6EF3', initial: 'Q', label: '腾讯企鹅号' },
  cnblogs:         { color: '#FF6D00', initial: '博', label: '博客园', needsTitle: true },
  oschina:         { color: '#06A64D', initial: '开', label: 'OSCHINA' },
  segmentfault:    { color: '#009A61', initial: '思', label: 'SegmentFault', needsTitle: true },
  $51cto:          { color: '#D81E06', initial: '5', label: '51CTO', needsTitle: true },
};

// 平台登录/访问链接
const PLATFORM_URLS: Record<string, string> = {
  juejin:          'https://juejin.cn/',
  csdn:            'https://www.csdn.net/',
  bilibili:        'https://www.bilibili.com/',
  xiaohongshu:     'https://www.xiaohongshu.com/',
  weibo:           'https://weibo.com/',
  douyin:          'https://www.douyin.com/',
  weixin:          'https://mp.weixin.qq.com/',
  weixin_channels: 'https://channels.weixin.qq.com/',
  zhihu:           'https://www.zhihu.com/',
  toutiao:         'https://mp.toutiao.com/',
  baijiahao:       'https://baijiahao.baidu.com/',
  kuaishou:        'https://www.kuaishou.com/',
  douban:          'https://www.douban.com/',
  jianshu:         'https://www.jianshu.com/',
  zsxq:            'https://www.zsxq.com/',
  qq_om:           'https://om.qq.com/',
  cnblogs:         'https://www.cnblogs.com/',
  oschina:         'https://www.oschina.net/',
  segmentfault:    'https://segmentfault.com/',
  $51cto:          'https://www.51cto.com/',
};

const platformColor   = (code: string) => PLATFORM_META[code]?.color   ?? '#6366f1';
const platformInitial = (code: string) => PLATFORM_META[code]?.initial ?? code.charAt(0).toUpperCase();
const platformUrl     = (code: string) => PLATFORM_URLS[code] ?? '#';

// ── 页面与 UI 状态 ─────────────────────────────────────────────────────────
const showPlatformModal = ref(false);
const activePlatform    = ref<string | null>(null);
const selectedDraftId   = ref<string | null>(null);

// ── 内容同步状态 ──────────────────────────────────────────────────────
// 全局文案存在 localPublish.value.content
// 各平台的独立同步状态：key=platform code, value=是否与第一个平台同步
const platformSyncStatus = ref<Record<string, boolean>>({}); // 默认所有平台都同步
const platformContents = ref<Record<string, string>>({}); // 仅当平台取消同步时才存储独立内容
const platformTitles = ref<Record<string, string>>({}); // 平台独立标题
const platformImages = ref<Record<string, string[]>>({}); // 平台独立图片列表

// ── 表单状态 ──────────────────────────────────────────────────────────────
const platformOptions       = ref<{ label: string; value: string; link?: string }[]>([]);
const loggedInPlatformCodes = ref<string[]>([]); // 已登录的平台代码列表
const loggedInPlatformLinks = ref<{ label: string; value: string; link: string }[]>([]);
const hasDetectedPlatforms  = ref(false); // 是否曾经检测过平台登录状态
const localImageInputRef    = ref<HTMLInputElement | null>(null);
const localImageDataUrls    = ref<string[]>([]);
const selectedDraftImageMetadata = ref<ImageMetadata[]>([]); // 用于显示草稿中丢失的图片信息

const localPublish = ref({
  mediaType:     'moment' as 'article' | 'moment' | 'video',
  platformCodes: [] as string[],
  title:         '',
  content:       '',
  imageUrls:     '',
});

// ── 草稿历史 ────────────────────────────────────────────────────────────
type ImageMetadata = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
};

type Draft = {
  id: string;
  content: string;
  time: number;
  platforms: string[];
  platformCodes: string[];
  platformData?: Record<string, string>;
  platformTitles?: Record<string, string>;
  platformImages?: Record<string, string[]>;
  isSynced?: boolean;
  title?: string;
  imageMetadata?: ImageMetadata[];
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

// 用于 PlatformModal 的平台选项（始终显示所有 PLATFORM_META 里的平台）
const availablePlatformsForModal = computed(() => {
  // 始终显示所有平台，检测结果只用来标记哪些已登录
  const result = Object.entries(PLATFORM_META).map(([code, meta]) => {
    const detected = platformOptions.value.find((p) => p.value === code);
    return {
      label: meta.label,
      value: code,
      link: detected?.link || platformUrl(code),
    };
  });
  console.log('[PostBot] availablePlatformsForModal:', result.length, '个平台');
  return result;
});

const currentContent = computed<string>({
  get() {
    if (!activePlatform.value) return localPublish.value.content;
    // 第一个平台始终可编辑（用于编辑全局文案）
    // 其他平台：如果同步，返回全局文案；否则返回独立文案
    const isFirstPlatform = activePlatform.value === localPublish.value.platformCodes[0];
    const isSynced = platformSyncStatus.value[activePlatform.value] !== false; // 默认同步

    if (isFirstPlatform || isSynced) {
      return localPublish.value.content;
    }
    return platformContents.value[activePlatform.value] ?? localPublish.value.content;
  },
  set(val: string) {
    if (!activePlatform.value) {
      localPublish.value.content = val;
      return;
    }
    // 第一个平台始终编辑全局文案
    const isFirstPlatform = activePlatform.value === localPublish.value.platformCodes[0];
    const isSynced = platformSyncStatus.value[activePlatform.value] !== false;

    if (isFirstPlatform || isSynced) {
      // 第一个平台或同步模式：修改全局文案
      localPublish.value.content = val;
    } else {
      // 独立模式（非第一个平台）：修改该平台的独立文案
      platformContents.value = { ...platformContents.value, [activePlatform.value]: val };
    }
  },
});

// 标题 computed 属性 - 支持平台独立编辑
const currentTitle = computed<string>({
  get() {
    if (!activePlatform.value) return localPublish.value.title;
    const isFirstPlatform = activePlatform.value === localPublish.value.platformCodes[0];
    const isSynced = platformSyncStatus.value[activePlatform.value] !== false;

    if (isFirstPlatform || isSynced) {
      return localPublish.value.title;
    }
    return platformTitles.value[activePlatform.value] ?? localPublish.value.title;
  },
  set(val: string) {
    if (!activePlatform.value) {
      localPublish.value.title = val;
      return;
    }
    const isFirstPlatform = activePlatform.value === localPublish.value.platformCodes[0];
    const isSynced = platformSyncStatus.value[activePlatform.value] !== false;

    if (isFirstPlatform || isSynced) {
      localPublish.value.title = val;
    } else {
      platformTitles.value = { ...platformTitles.value, [activePlatform.value]: val };
    }
  },
});

// 图片列表 computed 属性 - 支持平台独立编辑
const currentImages = computed<string[]>({
  get() {
    if (!activePlatform.value) return localImageDataUrls.value;
    const isFirstPlatform = activePlatform.value === localPublish.value.platformCodes[0];
    const isSynced = platformSyncStatus.value[activePlatform.value] !== false;

    if (isFirstPlatform || isSynced) {
      return localImageDataUrls.value;
    }
    return platformImages.value[activePlatform.value] ?? localImageDataUrls.value;
  },
  set(val: string[]) {
    if (!activePlatform.value) {
      localImageDataUrls.value = val;
      return;
    }
    const isFirstPlatform = activePlatform.value === localPublish.value.platformCodes[0];
    const isSynced = platformSyncStatus.value[activePlatform.value] !== false;

    if (isFirstPlatform || isSynced) {
      localImageDataUrls.value = val;
    } else {
      platformImages.value = { ...platformImages.value, [activePlatform.value]: val };
    }
  },
});

// 平台内容限制检查 - 返回当前平台的限制违规列表
const platformLimitWarnings = computed(() => {
  if (!activePlatform.value) return [];
  return checkPlatformLimits(
    activePlatform.value,
    localPublish.value.mediaType as 'moment' | 'article' | 'video',
    currentTitle.value,
    currentContent.value,
    currentImages.value.length
  );
});

// 当前平台是否有限制违规
const hasPlatformLimitWarning = computed(() => {
  return platformLimitWarnings.value.length > 0;
});

// 返回所有已启用平台的限制违规情况（用于平台标签提示）
const platformLimitStatus = computed(() => {
  const status: Record<string, boolean> = {};
  for (const platform of enabledPlatforms.value) {
    status[platform.value] = hasPlatformLimitViolation(
      platform.value,
      localPublish.value.mediaType as 'moment' | 'article' | 'video',
      currentTitle.value,
      currentContent.value,
      currentImages.value.length
    );
  }
  return status;
});

// ── 方法 ─────────────────────────────────────────────────────────────────
const onAddImage  = () => { if (localImageInputRef.value) localImageInputRef.value.click(); };
const openPlatforms  = () => { showPlatformModal.value = true; };
const closePlatforms = () => { showPlatformModal.value = false; };

const togglePlatform = (code: string) => {
  const arr = localPublish.value.platformCodes;
  const idx = arr.indexOf(code);
  if (idx === -1) {
    arr.push(code);
    // Initialize content, title, and images for new platform (synced by default)
    // They won't be used unless the platform is switched to independent mode
    if (!activePlatform.value) activePlatform.value = code;
  } else {
    arr.splice(idx, 1);
    // Clean up platform-specific data when removing platform
    const newContents = { ...platformContents.value };
    const newTitles = { ...platformTitles.value };
    const newImages = { ...platformImages.value };
    const newStatus = { ...platformSyncStatus.value };
    delete newContents[code];
    delete newTitles[code];
    delete newImages[code];
    delete newStatus[code];
    platformContents.value = newContents;
    platformTitles.value = newTitles;
    platformImages.value = newImages;
    platformSyncStatus.value = newStatus;

    // Always update activePlatform if the removed platform was active, or if activePlatform is not in the remaining list
    if (activePlatform.value === code || !arr.includes(activePlatform.value ?? '')) {
      activePlatform.value = arr[0] ?? null;
    }
  }
};

const toggleSync = () => {
  if (!activePlatform.value) return;

  // 第一个平台不允许切换同步状态（始终同步）
  const isFirstPlatform = activePlatform.value === localPublish.value.platformCodes[0];
  if (isFirstPlatform) return;

  const isSynced = platformSyncStatus.value[activePlatform.value] !== false;

  if (isSynced) {
    // 从同步切到独立：保存当前全局文案、标题、图片作为该平台的初始独立内容
    platformContents.value = {
      ...platformContents.value,
      [activePlatform.value]: localPublish.value.content
    };
    platformTitles.value = {
      ...platformTitles.value,
      [activePlatform.value]: localPublish.value.title
    };
    platformImages.value = {
      ...platformImages.value,
      [activePlatform.value]: [...localImageDataUrls.value]
    };
    platformSyncStatus.value = {
      ...platformSyncStatus.value,
      [activePlatform.value]: false
    };
  } else {
    // 从独立切回同步：删除该平台的独立内容（文案、标题、图片）
    const newPlatformContents = { ...platformContents.value };
    const newPlatformTitles = { ...platformTitles.value };
    const newPlatformImages = { ...platformImages.value };
    delete newPlatformContents[activePlatform.value];
    delete newPlatformTitles[activePlatform.value];
    delete newPlatformImages[activePlatform.value];
    platformContents.value = newPlatformContents;
    platformTitles.value = newPlatformTitles;
    platformImages.value = newPlatformImages;
    platformSyncStatus.value = {
      ...platformSyncStatus.value,
      [activePlatform.value]: true
    };
  }
};

const removeImage = (index: number) => {
  currentImages.value.splice(index, 1);
};

const reorderImages = (payload: { from: number; to: number; newOrder: string[] }) => {
  currentImages.value = payload.newOrder;
};

/**
 * 快速重新加载草稿中丢失的图片
 * 用户点击"重新加载图片"按钮后，打开文件选择器
 * 系统会验证用户选择的图片是否与保存的元数据匹配
 */
const quickReloadImages = () => {
  if (localImageInputRef.value) {
    // 临时监听文件选择
    const handleFilesSelected = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      if (!files) return;

      localImageInputRef.value?.removeEventListener('change', handleFilesSelected);

      const expectedCount = selectedDraftImageMetadata.value.length;
      const selectedCount = files.length;

      // 检查数量是否匹配
      if (selectedCount !== expectedCount) {
        const msg = `文件数量不匹配。期望 ${expectedCount} 张，你选择了 ${selectedCount} 张。`;
        alert(msg);
        target.value = '';
        return;
      }

      // 转换图片并验证
      const newDataUrls: string[] = [];
      let allMatched = true;

      for (let i = 0; i < files.length; i++) {
        try {
          const file = files[i];
          const expectedMetadata = selectedDraftImageMetadata.value[i];

          // 验证文件是否与元数据匹配
          if (expectedMetadata && !isImageMatch(file, expectedMetadata)) {
            console.warn(`[PostBot] 图片 #${i + 1} 不匹配：期望 ${expectedMetadata.name}，得到 ${file.name}`);
            allMatched = false;
          }

          const dataUrl = await fileToDataUrl(file);
          newDataUrls.push(dataUrl);
        } catch (err) {
          console.error('[PostBot] 转换图片失败:', err);
        }
      }

      // 如果文件不匹配，提示用户但仍然加载（用户可能有理由这样做）
      if (!allMatched) {
        console.warn('[PostBot] 部分图片与保存的元数据不匹配，但已加载');
      }

      // 替换图片
      if (newDataUrls.length > 0) {
        currentImages.value = newDataUrls;
        selectedDraftImageMetadata.value = []; // 清除丢失的图片提示
      }

      // 重置 input
      target.value = '';
    };

    localImageInputRef.value.addEventListener('change', handleFilesSelected);
    localImageInputRef.value.click();
  }
};

// ── 草稿助手 ────────────────────────────────────────────────────────────
const createNewDraft = () => {
  const newDraftId = Date.now().toString();
  selectedDraftId.value = newDraftId;
  localPublish.value.content = '';
  platformContents.value = {};
  platformTitles.value = {};
  platformImages.value = {};
  platformSyncStatus.value = {}; // 重置所有平台为同步状态
  localImageDataUrls.value = []; // 清除图片
  selectedDraftImageMetadata.value = []; // 清除丢失图片提示
  localPublish.value.title = ''; // 清除标题

  // 保留当前平台选择，activePlatform 若已在列表中则不动，否则取第一个
  if (!localPublish.value.platformCodes.includes(activePlatform.value ?? '')) {
    activePlatform.value = localPublish.value.platformCodes[0] ?? null;
  }

  // 立即创建空白草稿条目
  const emptyDraft: Draft = {
    id: newDraftId,
    content: '',
    time: Date.now(),
    platforms: enabledPlatforms.value.map((p) => p.label),
    platformCodes: [...localPublish.value.platformCodes],
    platformData: {},
    isSynced: true,
  };

  drafts.value = [emptyDraft, ...drafts.value.slice(0, 49)];
  chrome.storage.local.set({ [DRAFTS_KEY]: drafts.value });
};

const deleteDraft = async (id: string) => {
  if (!confirm('确定要删除这篇草稿吗？')) return;
  try {
    await deleteAllImageBlobs(id);
  } catch (err) {
    console.warn('[PostBot] 删除草稿图片失败:', err);
  }
  const updated = drafts.value.filter(d => d.id !== id);
  drafts.value = updated;
  chrome.storage.local.set({ [DRAFTS_KEY]: updated });
  if (selectedDraftId.value === id) createNewDraft();
};

const saveDraft = async () => {
  const content = localPublish.value.content.trim();
  if (!content) return;

  const platformData: Record<string, string> = {};
  const platformTitleData: Record<string, string> = {};
  const platformImageData: Record<string, string[]> = {};

  // 保存所有非同步平台的独立内容、标题和图片
  for (const code of localPublish.value.platformCodes) {
    if (platformSyncStatus.value[code] === false) {
      platformData[code] = platformContents.value[code] || content;
      platformTitleData[code] = platformTitles.value[code] || localPublish.value.title;
      platformImageData[code] = platformImages.value[code] || localImageDataUrls.value;
    }
  }

  if (!selectedDraftId.value) {
    selectedDraftId.value = Date.now().toString();
  }

  // 检查是否有任何平台是独立的
  const hasIndependent = Object.values(platformSyncStatus.value).some(v => v === false);

  const draft: Draft = {
    id: selectedDraftId.value,
    content,
    time: Date.now(),
    platforms: enabledPlatforms.value.map((p) => p.label),
    platformCodes: [...localPublish.value.platformCodes],
    platformData,
    platformTitles: Object.keys(platformTitleData).length > 0 ? platformTitleData : undefined,
    platformImages: Object.keys(platformImageData).length > 0 ? platformImageData : undefined,
    isSynced: !hasIndependent,
    title: localPublish.value.title || undefined,
    imageMetadata: localImageDataUrls.value.length > 0 ? localImageDataUrls.value.map((_, i) => ({
      name: `image_${i + 1}.jpg`,
      size: 0,
      type: 'image/jpeg',
      lastModified: Date.now(),
    })) : undefined
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
  [() => localPublish.value.content, () => localPublish.value.platformCodes, () => localPublish.value.title, platformContents, platformTitles, platformImages, platformSyncStatus, localImageDataUrls],
  () => {
    if (localPublish.value.content.trim()) saveDraft().catch(err => console.error('[PostBot] 自动保存草稿失败:', err));
  },
  { deep: true }
);

const loadDraft = async (d: Draft) => {
  selectedDraftId.value = d.id;
  localPublish.value.content = d.content;
  localPublish.value.platformCodes = [...d.platformCodes];
  localPublish.value.title = d.title || '';

  // Try to load images from IndexedDB
  try {
    const savedFiles = await getImageBlobs(d.id);
    if (savedFiles && savedFiles.length > 0) {
      // Successfully loaded images from IndexedDB
      const dataUrls: string[] = [];
      for (const file of savedFiles) {
        try {
          const dataUrl = await dbFileToDataUrl(file);
          dataUrls.push(dataUrl);
        } catch (err) {
          console.warn('[PostBot] 转换图片数据URL失败:', err);
        }
      }
      localImageDataUrls.value = dataUrls;
      selectedDraftImageMetadata.value = []; // Clear missing image alert since images are loaded
    } else {
      // No images found in IndexedDB - show missing image alert
      selectedDraftImageMetadata.value = d.imageMetadata ? [...d.imageMetadata] : [];
      localImageDataUrls.value = [];
    }
  } catch (err) {
    console.warn('[PostBot] 加载草稿图片失败，显示缺失图片提示:', err);
    // Show missing images alert if load failed
    selectedDraftImageMetadata.value = d.imageMetadata ? [...d.imageMetadata] : [];
    localImageDataUrls.value = [];
  }

  // Restore platform-level sync status and platform-specific content, titles, and images
  if (d.platformData && !d.isSynced) {
    // Some platforms were independent when saved
    platformContents.value = { ...d.platformData };
    platformTitles.value = d.platformTitles ? { ...d.platformTitles } : {};
    platformImages.value = d.platformImages ? { ...d.platformImages } : {};
    // Mark only independent platforms in sync status (false = independent)
    platformSyncStatus.value = {};
    for (const code of d.platformCodes) {
      platformSyncStatus.value[code] = !d.platformData[code]; // if platformData has content, it's independent
    }
  } else {
    // All platforms synced
    platformContents.value = {};
    platformTitles.value = {};
    platformImages.value = {};
    platformSyncStatus.value = {};
    for (const code of d.platformCodes) {
      platformSyncStatus.value[code] = true; // all synced
    }
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
    // 检查是否存在检测记录（有 lastDetected 字段表示曾经检测过）
    if (detected && typeof detected === 'object' && 'lastDetected' in detected) {
      platformOptions.value = Array.isArray(detected.options) ? detected.options : [];
      loggedInPlatformCodes.value = Array.isArray(detected.loggedInCodes) ? detected.loggedInCodes : [];
      loggedInPlatformLinks.value = Array.isArray(detected.links) ? detected.links : [];
      hasDetectedPlatforms.value = true; // 标记曾经检测过
      console.log('[PostBot] 从存储恢复检测状态:', { options: platformOptions.value.length, loggedIn: loggedInPlatformCodes.value });
    } else {
      // 如果从未检测过，初始化为空
      platformOptions.value = [];
      loggedInPlatformCodes.value = [];
      loggedInPlatformLinks.value = [];
      hasDetectedPlatforms.value = false;
      console.log('[PostBot] 无检测状态，初始化为空');
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

// 监听平台列表变化，确保 activePlatform 始终有效
watch(() => localPublish.value.platformCodes, (newCodes) => {
  if (Array.isArray(newCodes) && newCodes.length > 0) {
    if (!activePlatform.value || !newCodes.includes(activePlatform.value)) {
      // 使用 nextTick 确保 DOM 更新
      nextTick(() => {
        activePlatform.value = newCodes[0];
      });
    }
  }
}, { deep: true });

// ── 图片处理 ───────────────────────────────────────────────────────────
const onLocalImagesSelected = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const files = input.files;
  if (!files?.length) return;

  const results: string[] = [];
  let completed = 0;
  const draftId = selectedDraftId.value || Date.now().toString();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith('image/')) {
      if (++completed === files.length) {
        localImageDataUrls.value = [...localImageDataUrls.value, ...results];
        input.value = '';
      }
      continue;
    }

    // Save image blob to IndexedDB
    const imageIndex = localImageDataUrls.value.length + results.length;
    try {
      await saveImageBlob(draftId, imageIndex, file);
    } catch (err) {
      console.warn('[PostBot] 保存图片到IndexedDB失败:', err);
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) results.push(reader.result as string);
      if (++completed === files.length) {
        localImageDataUrls.value = [...localImageDataUrls.value, ...results];
        input.value = '';
        // Update draft ID if it was just created
        if (!selectedDraftId.value) {
          selectedDraftId.value = draftId;
        }
      }
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
      loggedInPlatformCodes.value = loggedInCodes; // 保存已登录的平台代码
      loggedInPlatformLinks.value = platformOptions.value.map((o) => ({
        label: o.label,
        value: o.value,
        link: o.link || '#'
      }));

      chrome.storage.local.set({
        'postbot_detected_platforms': {
          options: platformOptions.value,
          links: loggedInPlatformLinks.value,
          loggedInCodes: loggedInCodes,
          lastDetected: Date.now()
        }
      });
      hasDetectedPlatforms.value = true; // 标记已检测过

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
      // 即使没有检测到已登录平台，也要保存检测结果（空列表）以标记已检测过
      chrome.storage.local.set({
        'postbot_detected_platforms': {
          options: [],
          links: [],
          loggedInCodes: [],
          lastDetected: Date.now()
        }
      });
      hasDetectedPlatforms.value = true; // 标记已检测过
      platformOptions.value = [];
      loggedInPlatformCodes.value = [];
      loggedInPlatformLinks.value = [];
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

  // Build platform-specific content, title, and images mapping
  const platformSpecificContents: Record<string, string> = {};
  const platformSpecificTitles: Record<string, string> = {};
  const platformSpecificImages: Record<string, { src: string }[]> = {};

  for (const code of validCodes) {
    // Check sync status to determine which content to use
    const isIndependent = platformSyncStatus.value[code] === false;

    if (isIndependent) {
      // Independent mode: use platform-specific content, title, and images
      platformSpecificContents[code] = platformContents.value[code] || localPublish.value.content;
      platformSpecificTitles[code] = platformTitles.value[code] || localPublish.value.title;
      const images = platformImages.value[code] || localImageDataUrls.value;
      platformSpecificImages[code] = images.map((src) => ({ src }));
    } else {
      // Synced mode: use global content, title, and images
      platformSpecificContents[code] = localPublish.value.content;
      platformSpecificTitles[code] = localPublish.value.title;
      platformSpecificImages[code] = localImageDataUrls.value.map((src) => ({ src }));
    }
  }

  // Get global images for fallback
  const urls = [...(imageUrls || '').split(/[\r\n]+/).map((s) => s.trim()).filter(Boolean), ...localImageDataUrls.value];
  const cover = urls.length ? urls : undefined;

  // Send once with all platforms and their specific content/title/images mapping
  chrome.runtime.sendMessage({
    type: 'request',
    action: POSTBOT_ACTION.PUBLISH_NOW,
    data: {
      mediaType,
      platformCodes: validCodes,
      title: localPublish.value.title,
      content: localPublish.value.content,
      platformSpecificContents,
      platformSpecificTitles,
      platformSpecificImages,
      contentImages: localImageDataUrls.value.map((src) => ({ src })),
      images: localImageDataUrls.value.map((src) => ({ src })),
      cover,
      isAutoPublish: false
    }
  });
  saveDraft().catch(err => console.error('[PostBot] 发布时保存草稿失败:', err));
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
