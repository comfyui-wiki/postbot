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
import { reactive } from "vue";

import { fetchImageToBase64 } from "~utils/image";
import { weixinArticlePublisher } from "./platform/article/weixin.publisher";
import { toutiaoArticlePublisher } from "./platform/article/toutiao.publisher";
import { xiaohongshuMomentPublisher } from "./platform/moment/xiaohongshu.publisher";
import { zhihuArticlePublisher } from "./platform/article/zhihu.publisher";
import { weiboArticlePublisher } from "./platform/article/weibo.publisher";
import { baijiahaoArticlePublisher } from "./platform/article/baijiahao.publisher";
import { qqOmArticlePublisher } from "./platform/article/qqOm.publisher";
import { douyinArticlePublisher } from "./platform/article/douyin.publisher";
import { bilibiliArticlePublisher } from "./platform/article/bilibili.publisher";
import { bilibiliMomentPublisher } from "./platform/moment/bilibili.publisher";
import { doubanArticlePublisher } from "./platform/article/douban.publisher";
import { jianshuArticlePublisher } from "./platform/article/jianshu.publisher";
import { zsxqArticlePublisher } from "./platform/article/zsxq.publisher";

import { weiboMomentPublisher } from "./platform/moment/weibo.publisher";
import { toutiaoMomentPublisher } from "./platform/moment/toutiao.publisher";
import { baijiahaoMomentPublisher } from "./platform/moment/baijiahao.publisher";
import { zhihuMomentPublisher } from "./platform/moment/zhihu.publisher";
import { weixinMomentPublisher } from "./platform/moment/weixin.publisher";
import { weixinChannelsMomentPublisher } from "./platform/moment/weixinChannels.publisher";
import { douyinMonmentPublisher } from "./platform/moment/douyin.publisher";
import { kuaishouMomentPublisher } from "./platform/moment/kuaishou.publisher";
import { doubanMomentPublisher } from "./platform/moment/douban.publisher";
import { zsxqMonmentPublisher } from "./platform/moment/zsxq.publisher";

import { douyinVideoPublisher } from "./platform/video/douyin.publisher";
import { kuaishouVideoPublisher } from "./platform/video/kuaishou.publisher";
import { bilibiliVideoPublisher } from "./platform/video/bilibili.publisher";
import { toutiaoVideoPublisher } from "./platform/video/toutiao.publisher";
import { weixinChannelsVideoPublisher } from "./platform/video/weixinChannels.publisher";
import { qqOmVideoPublisher } from "./platform/video/qqOm.publisher";
import { xiaohongshuVideoPublisher } from "./platform/video/xiaohongshu.publisher";
import { weiboVideoPublisher } from "./platform/video/weibo.publisher";
import { zhihuVideoPublisher } from "./platform/video/zhihu.publisher";

import { music163AudioPublisher } from "./platform/audio/music163.publisher";
import { qqmusicAudioPublisher } from "./platform/audio/qqmusic.publisher";
import { ximalayaAudioPublisher } from "./platform/audio/ximalaya.publisher";
import { qingtingAudioPublisher } from "./platform/audio/qingting.publisher";
import { lizhiAudioPublisher } from "./platform/audio/lizhi.publisher";
import { xiaoyuzhoufmAudioPublisher } from "./platform/audio/xiaoyuzhoufm.publisher";

export const publisher = reactive({
    article: {
        weixin: weixinArticlePublisher,
        toutiao: toutiaoArticlePublisher,
        xiaohongshu: xiaohongshuMomentPublisher,
        zhihu: zhihuArticlePublisher,
        weibo: weiboArticlePublisher,
        baijiahao: baijiahaoArticlePublisher,
        qq_om: qqOmArticlePublisher,
        weixin_channels: weixinChannelsMomentPublisher,
        douyin: douyinArticlePublisher,
        bilibili: bilibiliArticlePublisher,
        kuaishou: kuaishouMomentPublisher,
        douban: doubanArticlePublisher,
        jianshu: jianshuArticlePublisher,
        zsxq: zsxqArticlePublisher,
    },
    moment: {
        weibo: weiboMomentPublisher,
        toutiao: toutiaoMomentPublisher,
        xiaohongshu: xiaohongshuMomentPublisher,
        baijiahao: baijiahaoMomentPublisher,
        zhihu: zhihuMomentPublisher,
        weixin: weixinMomentPublisher,
        weixin_channels: weixinChannelsMomentPublisher,
        douyin: douyinMonmentPublisher,
        bilibili: bilibiliMomentPublisher,
        kuaishou: kuaishouMomentPublisher,
        douban: doubanMomentPublisher,
        zsxq: zsxqMonmentPublisher,
    },
    video: {
        douyin: douyinVideoPublisher,
        kuaishou: kuaishouVideoPublisher,
        bilibili: bilibiliVideoPublisher,
        toutiao: toutiaoVideoPublisher,
        weixin_channels: weixinChannelsVideoPublisher,
        qq_om: qqOmVideoPublisher,
        xiaohongshu: xiaohongshuVideoPublisher,
        weibo: weiboVideoPublisher,
        zhihu: zhihuVideoPublisher,
    },
    audio: {
        music163: music163AudioPublisher,
        qqmusic: qqmusicAudioPublisher,
        ximalaya: ximalayaAudioPublisher,
        qingting: qingtingAudioPublisher,
        lizhi: lizhiAudioPublisher,
        xiaoyuzhou: xiaoyuzhoufmAudioPublisher,
    }
});

export const executeScriptsToTabs = (tabs, data) => {
    console.log('executeScriptsToTabs');
    tabs?.forEach(item => {
        const { tab, platform } = item;
        if (!tab?.id) {
            return;
        }
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId !== tab.id || info.status !== 'complete') return;
            chrome.tabs.onUpdated.removeListener(listener);
            if (!platform) return;
            (async () => {
                const type = platform.type || 'article';
                const code = platform.code;
                platform['executeScript'] = publisher[type]?.[code] || publisher['article']?.[code];
                const payload = data?.data || {};
                const publisherData = {
                    data: {
                        title: payload.title,
                        content: payload.content,
                        description: payload.description ?? payload.content,
                        mediaType: payload.mediaType,
                        platformCodes: payload.platformCodes,
                        contentImages: payload.contentImages,
                        images: payload.images,
                        cover: payload.cover,
                        isAutoPublish: payload.isAutoPublish,
                    },
                    platform: { type, code },
                };
                if (type === 'moment' && code === 'bilibili') {
                    const urlSet = new Set<string>();
                    for (const x of payload.cover || []) {
                        const u = typeof x === 'object' && x !== null && 'url' in x ? (x as { url?: string }).url : x;
                        if (u) urlSet.add(String(u));
                    }
                    for (const x of payload.contentImages || payload.images || []) {
                        const o = typeof x === 'object' && x !== null ? x as { url?: string; src?: string } : null;
                        const u = o ? (o.url || o.src) : x;
                        if (u) urlSet.add(String(u));
                    }
                    const urls = Array.from(urlSet);
                    const settled = await Promise.allSettled(urls.map((u) => fetchImageToBase64(u)));
                    const contentImagesData = settled
                        .filter((r): r is PromiseFulfilledResult<NonNullable<Awaited<ReturnType<typeof fetchImageToBase64>>>> => r.status === 'fulfilled' && r.value != null)
                        .map((r) => r.value);
                    if (contentImagesData.length) publisherData.data.contentImagesData = contentImagesData;
                }
                // 哔哩哔哩动态发布需要在 MAIN 世界运行：
                // B站通过创建游离（非DOM）的 input[type=file] 并调用 .click() 来触发文件选择，
                // 只有在 MAIN 世界才能拦截 HTMLInputElement.prototype.click 注入图片文件。
                const scriptWorld = (type === 'moment' && code === 'bilibili') ? 'MAIN' : undefined;
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: platform.executeScript,
                    args: [publisherData],
                    world: scriptWorld as chrome.scripting.ExecutionWorld,
                });
            })();
        });
    });
}