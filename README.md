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
      3. 确认`OpenSSH`默认`shell`是`cmd`
      4. 如果执行失败重启服务器或者降低`OpenSSH`版本，本插件在`OpenSSH-8.1.0.0` 版本中测试通过

2. 在配置中填写服务器列表

   如果无法通过 ssh 连接服务器，可以在服务器上安装[vue-drop-server](https://github.com/maolidi/vue-drop-server)转发服务，插件服务器配置需要增加`useServer: true`

3. 左侧面板中点击对应服务器名称后边的投递按钮即可

## 插件配置

```js
- 是否启用自动编译：插件基于nodejs V18，如果项目nodejs大版本不一致有可能出现build失败，可设置为false跳过build阶段
    VueDrop.npmBuild.enabled: true/false
- 是否显示服务器IP：
    VueDrop.showHost.enabled: true/false
- 服务器列表（支持多级目录）：
    VueDrop.server: [
        {
            "name":"项目组1",
            "children":[
                {
                    "name": "项目1",
                    "host": "127.0.0.1",
                    "port": 22,
                    "username": "root",
                    "password": "<PASSWORD>",
                    "path": "/opt/dist",
                    "useServer":false
                }
            ]
        },
        {
            "name": "localhost",
            "host": "127.0.0.1",
            "port": 22,
            "username": "root",
            "password": "<PASSWORD>",
            "path": "/opt/dist",
            "useServer":false
        }
    ]
```

**Enjoy!**
