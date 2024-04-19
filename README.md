# vue-drop README

一款支持把 vue 前端项目 build 后自动投递到生产环境的工具

## 使用方法

1. 前置条件

   > linux 环境

   1. 无需特殊配置，只要保证有 tar 指令即可

   > windows 环境

   1. windows 基于 OpenSSH，需要服务器为 Windows Server 2019 或 Windows 10（内部版本 1809）以上的版本
   2. 服务器上还需配置 OpenSSH 客户端，服务器配置参考：
      [OpenSSH for Windows 概述](https://learn.microsoft.com/zh-cn/windows-server/administration/openssh/openssh_overview)

2. 在配置中填写服务器列表
3. 左侧面板中点击对应服务器名称后边的投递按钮即可

## 插件配置

```js
- 是否启用自动编译：false则跳过build阶段
    VueDrop.npmBuild.enabled: true/false
- 服务器列表：
    VueDrop.server: [
        {
            "name": "localhost",
            "host": "127.0.0.1",
            "port": 22,
            "username": "root",
            "password": "<PASSWORD>",
            "path": "/opt/dist"
        }
    ]
```

### V2.0.0 2024/04/19

1. 增加对 windows 的支持

### V1.1.0 2024/04/17

1. 打包路径支持从`vite.config.js`、`vue.config.js`中自动分析
2. 增加配置项`VueDrop.npmBuild.enabled`，是否需要执行`npm run build`命令

### V1.0.1 2024/04/16

1. 修复生产环境无法获取到 module

**Enjoy!**
