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
  <div class="popup-root">
    <p>正在打开发布助手…</p>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted } from 'vue';
  import { appSettings } from '../config/setting';

  onMounted(() => {
    chrome.storage.local.get('exploreVersionEnabled', (result) => {
      if (result.exploreVersionEnabled !== undefined) {
        appSettings.value.exploreVersionEnabled = result.exploreVersionEnabled;
      }
      openPublishEntry();
    });
  });

  function openPublishEntry() {
    function tryOpenSidePanel(windowId: number) {
      if (typeof chrome.sidePanel?.open !== 'function') {
        openPublishInTab();
        return;
      }
      chrome.sidePanel
        .open({ windowId })
        .then(() => {
          window.close();
        })
        .catch(() => {
          openPublishInTab();
        });
    }

    // 先取「有标签页的当前窗口」：popup 打开时 getCurrent 可能是弹窗，用活动标签所在窗口更可靠
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const windowId = tabs[0]?.windowId;
      if (windowId != null) {
        tryOpenSidePanel(windowId);
        return;
      }
      // 没有活动标签（例如在 popup 窗口内）则用 getLastFocused 取最近使用的浏览器窗口
      chrome.windows.getLastFocused((win) => {
        if (win?.id != null && win.type === 'normal') {
          tryOpenSidePanel(win.id);
        } else {
          openPublishInTab();
        }
      });
    });
  }

  function openPublishInTab() {
    // 侧边栏不可用时，在新标签页打开发布助手页面
    chrome.tabs.create({ url: chrome.runtime.getURL('sidepanel.html') });
    window.close();
  }

</script>

<style scoped>
/* 如果需要引入CSS，可以直接在这里写或者通过@import引入 */
@import '~style.css';
</style>