<template>
  <div class="middle-col">
    <div class="middle-header">
      <div class="middle-top-row">
        <span class="title">草稿箱</span>
        <div class="middle-header-actions">
          <button class="icon-btn" @click="$emit('open-settings')" title="设置">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>
      <button class="new-draft-btn" @click="$emit('new-draft')">
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
        :class="{ active: selectedId === d.id }"
        @click="$emit('select', d)"
      >
        <div class="draft-card-header">
          <div class="draft-card-content">{{ d.content || '无标题草稿' }}</div>
          <button class="delete-draft-btn" @click.stop="$emit('delete', d.id)" title="删除草稿">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
        <div class="draft-card-footer">
          <div class="draft-card-platforms">
            <span v-for="code in d.platformCodes" :key="code" class="mini-dot" :style="{ background: getPlatformColor(code) }"></span>
          </div>
          <span class="draft-card-time">{{ formatTime(d.time) }}</span>
        </div>
      </div>
    </div>
    <div class="middle-footer">
      <button class="detect-accounts-btn" @click="$emit('open-settings')">
        账号检测
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  drafts: any[];
  selectedId: string | null;
  getPlatformColor: (code: string) => string;
  formatTime: (ts: number) => string;
}>();

defineEmits(['new-draft', 'select', 'delete', 'open-settings']);
</script>

<style lang="less" scoped>
@surface:      #18181b;
@border:       rgba(255, 255, 255, 0.06);
@border-vis:   #27272a;
@text:         #f4f4f5;
@muted:        #71717a;
@accent:       #3b82f6;

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
  &:hover { background: rgba(255, 255, 255, 0.05); color: @text; }
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
  transition: background 0.2s;
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
  &:hover { background: rgba(255, 255, 255, 0.05); border-color: @muted; }
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
  &:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
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
</style>
