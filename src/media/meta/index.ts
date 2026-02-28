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
import { reactive } from 'vue';

import { weixinMetaInfo } from './weixin.meta';
import { toutiaoMetaInfo } from './toutiao.meta';
import { xiaohongshuMetaInfo } from './xiaohongshu.meta';
import { zhihuMetaInfo } from './zhihu.meta';
import { weiboMetaInfo } from './weibo.meta';
import { baijiahaoMetaInfo } from './baijiahao.meta';
import { douyinMetaInfo } from './douyin.meta';
import { kuaishouMetaInfo } from './kuaishou.meta';
import { bilibiliMetaInfo } from './bilibili.meta';
import { weixinChannelsMetaInfo } from './weixinChannels.meta';
import { qqOmMetaInfo } from './qqOm.meta';
import { doubanMetaInfo } from './douban.meta';
import { jianshuMetaInfo } from './jianshu.meta';
import { zsxqMetaInfo } from './zsxq.meta';

export const metaInfoList = reactive({
    weixin: weixinMetaInfo,
    toutiao: toutiaoMetaInfo,
    xiaohongshu: xiaohongshuMetaInfo,
    zhihu: zhihuMetaInfo,
    weibo: weiboMetaInfo,
    baijiahao: baijiahaoMetaInfo,
    douyin: douyinMetaInfo,
    kuaishou: kuaishouMetaInfo,
    bilibili: bilibiliMetaInfo,
    weixin_channels: weixinChannelsMetaInfo,
    qq_om: qqOmMetaInfo,
    douban: doubanMetaInfo,
    jianshu: jianshuMetaInfo,
    zsxq: zsxqMetaInfo,
});

export const getMetaInfoList = async () => {
    const results = await Promise.all(
        Object.keys(metaInfoList).map(async (key) => {
            let metaInfo = {};
            const meta = metaInfoList[key];
            if (meta != null) {
                try {
                    // 为每个平台的检测设置 5 秒超时，防止单个平台挂起导致全局失败
                    const mediaInfoPromise = meta?.getMediaInfo();
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout')), 5000)
                    );
                    
                    const mediaInfo = await Promise.race([mediaInfoPromise, timeoutPromise]);
                    
                    if (mediaInfo) {
                        mediaInfo[key] = key;
                        const metaInfo = {
                            [key]: mediaInfo
                        };
                        return metaInfo;
                    } else {
                        return metaInfo;
                    }
                } catch (e) {
                    const msg = e instanceof Error ? e.message : String(e);
                    console.error('获取失败', key, msg);
                    return metaInfo;
                }
            }
            return metaInfo;
        })
    );

    const metaInfos = results.reduce((acc, currentData) => {
        return { ...acc, ...currentData };
    }, {});

    return metaInfos;
}