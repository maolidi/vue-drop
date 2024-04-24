# vue-drop README

一款支持把 vue 前端项目 build 后自动投递到生产环境的工具

## 使用方法

1. 前置条件

   > linux 环境

   1. 无需特殊配置，只要保证有 tar 指令即可

   > windows 环境

   1. Windows Server 2019 或 Windows 10（内部版本 1809）以上的版本
      1. 这个版本已经集成 `OpenSSH` 和 `tar`,还需手动配置 `OpenSSH`，参考 [OpenSSH 安装向导](https://learn.microsoft.com/zh-cn/windows-server/administration/openssh/openssh_install_firstuse?tabs=gui)
   2. 其他版本
      1. 在[Win32-OpenSSH](https://github.com/PowerShell/Win32-OpenSSH)处参考 wiki 中的[安装说明](https://github.com/PowerShell/Win32-OpenSSH/wiki/Install-Win32-OpenSSH)离线安装
      2. 在[libarchive](https://www.libarchive.org/)处下载二进制包并在环境变量中添加 bin 目录，确保有 `bsdtar` 或 `tar` 命令
      3. 配置完毕后重启服务器

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

### V2.1.0 2024/04/24

1. 增加对低版本 windows 的支持

### V2.0.0 2024/04/19

1. 增加对 windows 的支持

### V1.1.0 2024/04/17

1. 打包路径支持从`vite.config.js`、`vue.config.js`中自动分析
2. 增加配置项`VueDrop.npmBuild.enabled`，是否需要执行`npm run build`命令

### V1.0.1 2024/04/16

1. 修复生产环境无法获取到 module

**Enjoy!**
