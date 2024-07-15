# Change Log

All notable changes to the "vue-drop" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

- 提高对 vue2 的 build 兼容性

## [2.4.1] - 2024-07-10

### Added

- 增加取消任务按钮

### Fixed

- 修复多级目录下无法投递

## [2.3.0] - 2024-07-09

### Changed

- 服务器节点支持多级目录

## [2.2.1] - 2024-05-11

### Changed

- 投递成功后删除本地压缩文件

## [2.2.0] - 2024-04-25

### Added

- 增加配置项`VueDrop.showHost.enabled`，是否显示服务器 IP

### Changed

- 优化编译环节
- 压缩环节、上传环节、投递环节增加进度条提示

## [2.1.1] - 2024-04-24

### Changed

- 修改服务节点图标，区分 windows 和 linux

## [2.1.0] - 2024-04-24

### Added

- 增加对低版本 windows 的支持

## [2.0.0] - 2024-04-19

### Added

- 增加对 Windows Server 2019 或 Windows 10（内部版本 1809）以上版本的支持

## [1.1.0] - 2024-04-17

### Added

- 增加配置项`VueDrop.npmBuild.enabled`，是否需要执行`npm run build`命令

### Changed

- 打包路径支持从`vite.config.js`、`vue.config.js`中自动分析

## [1.0.1] - 2024-04-16

### Added

- 增加对 Linux 的支持
