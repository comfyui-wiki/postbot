/**
 * Copyright (c) 2025-2099 GitCoffee All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
<template>
    <div class="local-publish-only">
        <header class="local-publish-header">
            <h1 class="local-publish-title">本地发布</h1>
            <p class="hint">直接打开各平台发布页并填表，不经过云端。请先确保浏览器已登录目标平台。</p>
        </header>
        <div class="local-publish-form">
            <Space direction="vertical" style="width: 100%;" :size="16" class="form-space">
                <div class="form-row">
                    <label class="form-label">内容类型</label>
                    <Select v-model:value="localPublish.mediaType" class="form-select" :options="[
                        { label: '文章', value: 'article' },
                        { label: '动态', value: 'moment' },
                        { label: '视频', value: 'video' },
                    ]" />
                </div>
                <div class="form-row">
                    <label class="form-label">发布平台</label>
                    <div class="platform-row">
                        <Select
                            v-model:value="localPublish.platformCodes"
                            mode="multiple"
                            class="form-select platform-select"
                            placeholder="先点「获取登录信息」"
                            :options="platformOptions"
                        />
                        <Button size="small" :loading="metaInfoLoading" class="btn-get-login" @click="loadMetaInfoList">获取登录信息</Button>
                    </div>
                </div>
                <div class="form-row">
                    <label class="form-label">标题</label>
                    <Input v-model:value="localPublish.title" placeholder="选填" class="form-input" />
                </div>
                <div class="form-row">
                    <label class="form-label">正文（HTML）</label>
                    <Input.TextArea v-model:value="localPublish.content" placeholder="<p>测试内容</p>" :rows="4" class="form-textarea" />
                </div>
                <div class="form-row">
                    <label class="form-label">图片（选填）</label>
                    <div class="image-actions">
                        <input ref="localImageInputRef" type="file" accept="image/*" multiple style="display: none" @change="onLocalImagesSelected" />
                        <Button size="small" @click="localImageInputRef?.click()">选择本地图片</Button>
                        <span v-if="localImageDataUrls.length" class="image-count">已选 {{ localImageDataUrls.length }} 张</span>
                        <Button v-if="localImageDataUrls.length" size="small" type="link" class="btn-clear" @click="clearLocalImages">清空</Button>
                    </div>
                    <Input.TextArea v-model:value="localPublish.imageUrls" placeholder="或填写图片链接（每行一个）" :rows="2" class="form-textarea" />
                </div>
                <div class="form-actions">
                    <Button type="primary" size="small" @click="triggerPublishNow">发布</Button>
                </div>
                <p class="form-hint">获取登录信息会检测已登录平台并填入上方，下方链接可打开各平台后台。</p>
                <div v-if="metaInfoSuccess" class="success-msg">
                    <div class="success-text">{{ metaInfoSuccess }}</div>
                    <div v-if="loggedInPlatformLinks.length" class="platform-links">
                        <a v-for="item in loggedInPlatformLinks" :key="item.value" :href="item.link" target="_blank" rel="noopener noreferrer" class="platform-link">{{ item.label }}</a>
                    </div>
                </div>
                <div v-if="metaInfoError" class="error-msg">{{ metaInfoError }}</div>
            </Space>
        </div>
    </div>
  </template>
  
  <script lang="ts" setup>
    import { ref, onMounted, watch } from 'vue';
    import 'ant-design-vue/dist/reset.css';
    import { Space, Button, Select, Input } from 'ant-design-vue';
    import { POSTBOT_ACTION } from '~message/postbot.action';

    const STORAGE_KEY = 'postbot_local_publish_state';

    const platformOptions = ref<{ label: string; value: string; link?: string }[]>([]);
    const loggedInPlatformLinks = ref<{ label: string; value: string; link: string }[]>([]);
    const localImageInputRef = ref<HTMLInputElement | null>(null);
    const localImageDataUrls = ref<string[]>([]);
    const localPublish = ref({
      mediaType: 'article' as 'article' | 'moment' | 'video',
      platformCodes: [] as string[],
      title: '本地测试标题',
      content: '<p>这是一段本地发布测试内容，不经过云端。</p>',
      imageUrls: '', // 每行一个图片 URL 或 data URL，选填
    });

    const saveState = () => {
      const mediaType = localPublish.value.mediaType;
      chrome.storage.local.get(STORAGE_KEY, (prev) => {
        const prevState = prev?.[STORAGE_KEY] && typeof prev[STORAGE_KEY] === 'object' ? prev[STORAGE_KEY] : {};
        const next = {
          ...prevState,
          lastMediaType: mediaType,
          [mediaType]: {
            mediaType,
            platformCodes: [...(localPublish.value.platformCodes || [])],
            platformOptions: platformOptions.value?.length ? platformOptions.value : undefined,
          },
        };
        chrome.storage.local.set({ [STORAGE_KEY]: next });
      });
    };

    onMounted(() => {
      chrome.storage.local.get(STORAGE_KEY, (result) => {
        const raw = result?.[STORAGE_KEY];
        if (!raw || typeof raw !== 'object') return;
        const lastType = raw.lastMediaType;
        const mediaType = (lastType === 'article' || lastType === 'moment' || lastType === 'video') ? lastType : localPublish.value.mediaType;
        if (mediaType !== localPublish.value.mediaType) {
          localPublish.value.mediaType = mediaType;
        }
        const forType = raw[mediaType] || raw;
        if (Array.isArray(forType.platformCodes)) {
          localPublish.value.platformCodes = forType.platformCodes;
        }
        if (Array.isArray(forType.platformOptions) && forType.platformOptions.length > 0) {
          platformOptions.value = forType.platformOptions.map((o: { label?: string; value?: string; link?: string }) => ({
            label: o.label ?? '',
            value: o.value ?? '',
            link: o.link,
          }));
        }
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
          if (Array.isArray(forType.platformCodes)) {
            localPublish.value.platformCodes = forType.platformCodes;
          }
          if (Array.isArray(forType.platformOptions) && forType.platformOptions.length > 0) {
            platformOptions.value = forType.platformOptions.map((o: { label?: string; value?: string; link?: string }) => ({
              label: o.label ?? '',
              value: o.value ?? '',
              link: o.link,
            }));
          } else {
            platformOptions.value = [];
          }
        });
      }
    );
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
          completed++;
          if (completed === total) {
            localImageDataUrls.value = [...localImageDataUrls.value, ...results];
            input.value = '';
          }
          continue;
        }
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) results.push(reader.result as string);
          completed++;
          if (completed === total) {
            localImageDataUrls.value = [...localImageDataUrls.value, ...results];
            input.value = '';
          }
        };
        reader.readAsDataURL(file);
      }
    };
    const clearLocalImages = () => { localImageDataUrls.value = []; };
    const metaInfoLoading = ref(false);
    const metaInfoError = ref('');
    const metaInfoSuccess = ref('');
    const sendToBackground = (payload: { type: string; action: string; data?: unknown }) =>
      new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(payload, (response: unknown) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        });
      });
    const loadMetaInfoList = async () => {
      metaInfoError.value = '';
      metaInfoSuccess.value = '';
      loggedInPlatformLinks.value = [];
      metaInfoLoading.value = true;
      try {
        const response = (await sendToBackground({
          type: 'request',
          action: POSTBOT_ACTION.META_INFO_LIST,
        })) as { metaInfoList?: Record<string, unknown>; error?: string };
        if (response?.error) throw new Error(response.error);
        const list = response?.metaInfoList ?? {};
        const loggedInCodes = typeof list === 'object' && list !== null ? Object.keys(list) : [];
        const count = loggedInCodes.length;
        if (count > 0) {
          let options: { label: string; value: string; link?: string }[];
          try {
            const platformRes = (await sendToBackground({
              type: 'request',
              action: POSTBOT_ACTION.PLATFORM_LIST,
              data: { type: localPublish.value.mediaType },
            })) as { platforms?: Array<{ code?: string; platformName?: string; homepage?: string; site?: string }>; error?: string };
            const raw = platformRes?.platforms ?? [];
            const all = Array.isArray(raw) ? raw : Object.values(raw || {});
            options = all
              .filter((p: { code?: string }) => loggedInCodes.includes(p?.code ?? ''))
              .map((p: { code?: string; platformName?: string; homepage?: string; site?: string }) => ({
                label: p.platformName || p.code || '',
                value: p.code || '',
                link: p.homepage || p.site || '#',
              }));
          } catch (_) {
            options = loggedInCodes.map((code) => ({ label: code, value: code, link: '#' }));
          }
          platformOptions.value = options;
          loggedInPlatformLinks.value = options.map((o) => ({ ...o, link: o.link || '#' }));
          localPublish.value.platformCodes = options.map((o) => o.value);
          saveState();
          const names = options.map((o) => o.label).join('、');
          metaInfoSuccess.value = `已获取 ${count} 个平台登录信息：${names}，可直接发布。`;
        } else {
          loggedInPlatformLinks.value = [];
          metaInfoSuccess.value = '未检测到已登录平台。请先在浏览器中打开并登录要发布的平台（如知乎、小红书等），再点「获取登录信息」。';
        }
      } catch (e) {
        metaInfoError.value = e instanceof Error ? e.message : String(e);
        console.error('[本地发布] 获取平台登录信息失败', e);
      } finally {
        metaInfoLoading.value = false;
      }
    };
    const triggerPublishNow = () => {
      const { mediaType, platformCodes, title, content, imageUrls } = localPublish.value;
      if (!platformCodes?.length) {
        return;
      }
      const urlLines = (imageUrls || '')
        .split(/[\r\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const urls = [...urlLines, ...localImageDataUrls.value];
      const contentImages = urls.map((src) => ({ src }));
      const cover = urls.length ? urls : undefined;
      chrome.runtime.sendMessage(
        {
          type: 'request',
          action: POSTBOT_ACTION.PUBLISH_NOW,
          data: {
            mediaType,
            platformCodes,
            title,
            content,
            contentImages: contentImages.length ? contentImages : undefined,
            images: contentImages.length ? contentImages : undefined,
            cover: cover,
            isAutoPublish: false,
          },
        },
        () => {}
      );
    };
  </script>
  
  <style lang="less" scoped>
  @accent: #6366f1;
  @accent-hover: #4f46e5;
  @bg: #f8fafc;
  @card-bg: #fff;
  @border: #e2e8f0;
  @text: #1e293b;
  @text-muted: #64748b;
  @radius: 10px;
  @radius-sm: 6px;
  @shadow: 0 1px 3px rgba(0, 0, 0, 0.06);

  .local-publish-only {
    min-height: 100vh;
    background: @bg;
    padding: 16px 12px;
    max-width: 100%;
    box-sizing: border-box;
  }

  .local-publish-header {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid @border;
  }

  .local-publish-title {
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 8px 0;
    color: @text;
    letter-spacing: -0.02em;
  }

  .hint {
    font-size: 12px;
    color: @text-muted;
    margin: 0;
    line-height: 1.5;
  }

  .local-publish-form {
    width: 100%;
    background: @card-bg;
    border-radius: @radius;
    padding: 18px;
    box-shadow: @shadow;
    border: 1px solid @border;
  }

  .form-space {
    width: 100%;
  }

  .form-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-label {
    font-size: 13px;
    font-weight: 500;
    color: @text;
  }

  .form-select {
    width: 140px;
  }
  .form-select.full-width {
    width: 100%;
  }
  .platform-row {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }
  .platform-select {
    flex: 1;
    min-width: 0;
  }
  .btn-get-login {
    flex-shrink: 0;
  }

  .form-input,
  .form-textarea {
    width: 100%;
  }

  .image-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }

  .image-count {
    font-size: 12px;
    color: @text-muted;
  }

  .btn-clear {
    font-size: 12px;
    padding: 0 4px;
    color: @text-muted;
    &:hover {
      color: @accent;
    }
  }

  .form-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding-top: 4px;
  }

  .form-hint {
    font-size: 11px;
    color: @text-muted;
    margin: 8px 0 0 0;
    line-height: 1.4;
  }

  .success-msg {
    color: #059669;
    font-size: 12px;
    margin-top: 6px;
    padding: 8px 10px;
    background: #ecfdf5;
    border-radius: @radius-sm;
  }
  .success-text {
    margin-bottom: 6px;
  }
  .platform-links {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 12px;
  }
  .platform-link {
    color: @accent;
    text-decoration: none;
    font-size: 12px;
    &:hover {
      text-decoration: underline;
    }
  }

  .error-msg {
    color: #dc2626;
    font-size: 12px;
    margin-top: 2px;
    padding: 6px 8px;
    background: #fef2f2;
    border-radius: @radius-sm;
  }

  /* Ant Design 组件覆盖 */
  :deep(.ant-select-selector),
  :deep(.ant-input),
  :deep(.ant-input.ant-input-status-error) {
    border-radius: @radius-sm !important;
    border-color: @border !important;
    font-size: 13px;
  }
  :deep(.ant-select-selector:hover),
  :deep(.ant-input:hover) {
    border-color: #cbd5e1 !important;
  }
  :deep(.ant-select-focused .ant-select-selector),
  :deep(.ant-input:focus),
  :deep(.ant-input-focused) {
    border-color: @accent !important;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15) !important;
  }
  :deep(textarea.ant-input) {
    resize: vertical;
    min-height: 72px;
  }
  :deep(.ant-btn) {
    border-radius: @radius-sm;
    font-size: 13px;
    font-weight: 500;
  }
  :deep(.ant-btn:not(.ant-btn-primary)) {
    background: @bg;
    border-color: @border;
    color: @text;
    &:hover {
      border-color: #cbd5e1;
      color: @accent;
    }
  }
  .form-actions :deep(.ant-btn-primary) {
    background: @accent !important;
    border-color: @accent !important;
    color: #fff !important;
    &:hover {
      background: @accent-hover !important;
      border-color: @accent-hover !important;
      color: #fff !important;
    }
  }
  </style>  