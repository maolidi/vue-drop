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
      return vscode.window.showInformationMessage("没有获取到服务器");
    }
    const rootPath = getProjectPath();
    let version = await getVueVersion(rootPath);
    if (!version) {
      return vscode.window.showInformationMessage("该项目不是VUE项目");
    }
    let enableBuild = vscode.workspace
      .getConfiguration("VueDrop")
      .get("npmBuild.enabled");
    if (enableBuild) {
      vscode.window.showInformationMessage("构建生产环境代码");
      await runBuild(rootPath);
    }
    let buildFloder = await getBuildFolder(rootPath);
    vscode.window.showInformationMessage("打包生产环境代码");
    // 统一使用tar格式
    await createTar(rootPath, buildFloder);
    vscode.window.showInformationMessage("投递生产环境代码");
    await dropFile(rootPath, server);
    vscode.window.showInformationMessage("执行成功");
  } catch (error) {
    console.log(error);
    vscode.window.showInformationMessage(`执行失败${error ? error : ""}`);
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
  const config = vscode.workspace.getConfiguration("VueDrop").get("server");
  return config.find((item) => item.name == label);
}
module.exports = drop;
