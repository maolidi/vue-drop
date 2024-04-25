const vscode = require("vscode");
const {
  getVueVersion,
  getBuildFolder,
  runBuild,
} = require("./../utils/buildHelper");
const { createTar } = require("./../utils/compressHelper");
const { dropFile } = require("./../utils/dropHelper");

async function drop(argument) {
  try {
    let server = getServer(argument.label);
    if (!server) {
      return vscode.window.showErrorMessage("没有获取到服务器");
    }
    const rootPath = getProjectPath();
    // 判断是否vue项目
    let version = await getVueVersion(rootPath);
    if (!version) {
      return vscode.window.showErrorMessage("该项目不是VUE项目");
    }
    // 判断是否要编译
    let enableBuild = vscode.workspace
      .getConfiguration("VueDrop")
      .get("npmBuild.enabled");
    if (enableBuild) {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "编译代码",
          cancellable: false,
        },
        async (progress) => {
          progress.report({ increment: 0 });
          await runBuild(rootPath);
          progress.report({ increment: 100 });
          return Promise.resolve();
        }
      );
    }
    // 分析编译后代码的文件目录
    let buildFloder = await getBuildFolder(rootPath);
    // 打包代码
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "打包代码",
        cancellable: false,
      },
      (progress) => {
        progress.report({ increment: 0 });
        return createTar(rootPath, buildFloder, progress);
      }
    );
    // 上传并发布
    await dropFile(rootPath, server);
    vscode.window.showInformationMessage("执行成功");
  } catch (error) {
    console.log(error);
    vscode.window.showErrorMessage(
      `执行失败${error ? "," + error : ""},请重试`
    );
  }
}
function getProjectPath() {
  // 获取当前工作区中的文件夹数组
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (workspaceFolders) {
    // 如果有工作区文件夹，则返回第一个文件夹的路径
    // 通常，这会是用户打开的项目路径
    return workspaceFolders[0].uri.fsPath;
  } else {
    // 如果没有工作区文件夹，可能用户打开的是单个文件
    // 这种情况下，你可能需要引导用户打开一个工作区或者文件夹
    vscode.window.showErrorMessage("请在VSCode中打开一个工作区或文件夹。");
    return null;
  }
}
function getServer(label) {
  // 如果有IP就把IP去掉
  let result = /(.*)[【[]/g.exec(label);
  if (result) {
    label = result[1];
  }
  const config = vscode.workspace.getConfiguration("VueDrop").get("server");
  return config.find((item) => item.name == label);
}
module.exports = drop;
