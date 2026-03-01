/**
 * Copyright (c) 2025-2099 GitCoffee All Rights Reserved.
 *
 * Platform Content Limits Configuration
 * 定义每个平台在不同内容类型下的限制规则（字符数、图片要求等）
 */

export interface ContentLimits {
  /** 标题相关限制 */
  title?: {
    /** 最小字符数 */
    min?: number;
    /** 最大字符数 */
    max?: number;
    /** 是否必需 */
    required?: boolean;
  };
  /** 正文内容限制 */
  content?: {
    /** 最小字符数 */
    min?: number;
    /** 最大字符数 */
    max?: number;
    /** 是否必需 */
    required?: boolean;
  };
  /** 图片相关限制 */
  images?: {
    /** 最少图片数 */
    min?: number;
    /** 最多图片数 */
    max?: number;
    /** 是否必需 */
    required?: boolean;
  };
}

export interface PlatformLimits {
  /** 平台代码 */
  code: string;
  /** 平台名称 */
  label: string;
  /** 动态类型的限制 */
  moment?: ContentLimits;
  /** 文章类型的限制 */
  article?: ContentLimits;
  /** 视频类型的限制 */
  video?: ContentLimits;
}

/**
 * 平台内容限制配置 - 按内容类型分类
 *
 * 配置说明：
 * - 支持三种内容类型：moment（动态）、article（文章）、video（视频）
 * - 如果某项未配置，表示该平台对此项无限制
 * - required: true 表示该项内容必须填写
 * - min/max: 表示字符数或图片数范围限制
 *
 * 类型说明：
 * - moment: 短动态/状态更新（微博、抖音、小红书等）
 * - article: 长篇文章（知乎、简书、微信公众号等）
 * - video: 视频内容（B站、抖音视频等）
 */
export const PLATFORM_LIMITS_CONFIG: Record<string, PlatformLimits> = {
  bilibili: {
    code: 'bilibili',
    label: 'Bilibili',
    moment: {
      title: {
        max: 20,
      },
      content: {
        min: 10,
        max: 1000,
        required: true,
      },
      images: {
        max: 18,
      },
    },
    video: {
      title: {
        max: 80,
        required: true,
      },
      content: {
        max: 5000,
      },
      images: {
        max: 1,
      },
    },
  },

  xiaohongshu: {
    code: 'xiaohongshu',
    label: '小红书',
    moment: {
      title: {
        max: 20,
        required: true,
      },
      content: {
        max: 2000,
        required: true,
      },
      images: {
        min: 1,
        max: 18,
        required: true,
      },
    },
  },

  weibo: {
    code: 'weibo',
    label: '微博',
    moment: {
      content: {
        max: 5000,
        required: true,
      },
      images: {
        max: 18,
      },
    },
  },

  douyin: {
    code: 'douyin',
    label: '抖音',
    moment: {
      title: {
        max: 20,
      },
      content: {
        max: 2000,
      },
      images: {
        max: 35,
      },
    },
    video: {
      title: {
        max: 80,
        required: true,
      },
      content: {
        max: 5000,
      },
    },
  },

  weixin: {
    code: 'weixin',
    label: '微信公众号',
    article: {
      title: {
        max: 64,
        required: true,
      },
      content: {
        required: true,
      },
      images: {
        max: 10,
      },
    },
  },

  weixin_channels: {
    code: 'weixin_channels',
    label: '视频号',
    moment: {
      title: {
        max: 50,
      },
      content: {
        max: 2000,
      },
      images: {
        max: 9,
      },
    },
    video: {
      title: {
        max: 100,
        required: true,
      },
      content: {
        max: 5000,
      },
    },
  },

  zhihu: {
    code: 'zhihu',
    label: '知乎',
    article: {
      title: {
        max: 50,
        required: true,
      },
      content: {
        max: 2000,
        required: true,
      },
      images: {
        max: 10,
      },
    },
  },

  toutiao: {
    code: 'toutiao',
    label: '今日头条',
    moment: {
      title: {
        max: 64,
        required: true,
      },
      content: {
        required: true,
      },
      images: {
        max: 10,
      },
    },
    article: {
      title: {
        max: 64,
        required: true,
      },
      content: {
        required: true,
      },
      images: {
        max: 10,
      },
    },
  },

  baijiahao: {
    code: 'baijiahao',
    label: '百家号',
    article: {
      title: {
        max: 80,
        required: true,
      },
      content: {
        required: true,
      },
      images: {
        max: 10,
      },
    },
  },

  kuaishou: {
    code: 'kuaishou',
    label: '快手',
    moment: {
      content: {
        max: 4000,
      },
      images: {
        max: 9,
      },
    },
  },

  douban: {
    code: 'douban',
    label: '豆瓣',
    moment: {
      content: {
        required: true,
      },
      images: {
        max: 10,
      },
    },
    article: {
      title: {
        required: true,
      },
      content: {
        required: true,
      },
      images: {
        max: 10,
      },
    },
  },

  jianshu: {
    code: 'jianshu',
    label: '简书',
    article: {
      title: {
        required: true,
      },
      content: {
        required: true,
      },
    },
  },

  zsxq: {
    code: 'zsxq',
    label: '知识星球',
    moment: {
      content: {
        required: true,
      },
      images: {
        max: 10,
      },
    },
  },

  qq_om: {
    code: 'qq_om',
    label: '腾讯企鹅号',
    article: {
      title: {
        max: 80,
        required: true,
      },
      content: {
        required: true,
      },
      images: {
        max: 10,
      },
    },
  },
};

/**
 * 获取特定平台和内容类型的限制配置
 * @param platformCode 平台代码
 * @param mediaType 内容类型 (moment/article/video)
 * @returns 该平台该类型的限制配置，若无则返回空对象
 */
export function getPlatformLimits(
  platformCode: string,
  mediaType: 'moment' | 'article' | 'video' = 'moment'
): ContentLimits {
  const platform = PLATFORM_LIMITS_CONFIG[platformCode];
  if (!platform) return {};

  const limits = platform[mediaType];
  return limits || {};
}

/**
 * 检查内容是否满足平台限制
 * @param platformCode 平台代码
 * @param mediaType 内容类型
 * @param title 标题
 * @param content 正文内容
 * @param imageCount 图片数量
 * @returns 返回警告信息数组，为空表示符合所有限制
 */
export function checkPlatformLimits(
  platformCode: string,
  mediaType: 'moment' | 'article' | 'video' = 'moment',
  title: string = '',
  content: string = '',
  imageCount: number = 0
): string[] {
  const limits = getPlatformLimits(platformCode, mediaType);
  if (Object.keys(limits).length === 0) return [];

  const warnings: string[] = [];

  // 检查标题
  if (limits.title) {
    if (limits.title.required && !title.trim()) {
      warnings.push('标题必填');
    } else if (title.trim()) {
      const titleLen = title.length;
      if (limits.title.min && titleLen < limits.title.min) {
        warnings.push(`标题最少 ${limits.title.min} 字（当前 ${titleLen} 字）`);
      }
      if (limits.title.max && titleLen > limits.title.max) {
        warnings.push(`标题最多 ${limits.title.max} 字（当前 ${titleLen} 字）`);
      }
    }
  }

  // 检查正文
  if (limits.content) {
    if (limits.content.required && !content.trim()) {
      warnings.push('正文必填');
    } else if (content.trim()) {
      const contentLen = content.length;
      if (limits.content.min && contentLen < limits.content.min) {
        warnings.push(`正文最少 ${limits.content.min} 字（当前 ${contentLen} 字）`);
      }
      if (limits.content.max && contentLen > limits.content.max) {
        warnings.push(`正文最多 ${limits.content.max} 字（当前 ${contentLen} 字）`);
      }
    }
  }

  // 检查图片
  if (limits.images) {
    if (limits.images.required && imageCount === 0) {
      warnings.push('必须上传至少1张图片');
    } else if (imageCount > 0) {
      if (limits.images.min && imageCount < limits.images.min) {
        warnings.push(`至少需要 ${limits.images.min} 张图片（当前 ${imageCount} 张）`);
      }
      if (limits.images.max && imageCount > limits.images.max) {
        warnings.push(`最多只能 ${limits.images.max} 张图片（当前 ${imageCount} 张）`);
      }
    }
  }

  return warnings;
}

/**
 * 检查内容是否有任何限制违规
 * @returns true 表示有违规，需要显示警告
 */
export function hasPlatformLimitViolation(
  platformCode: string,
  mediaType: 'moment' | 'article' | 'video' = 'moment',
  title: string = '',
  content: string = '',
  imageCount: number = 0
): boolean {
  return checkPlatformLimits(platformCode, mediaType, title, content, imageCount).length > 0;
}
