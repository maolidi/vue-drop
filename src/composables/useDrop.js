const vscode = require("vscode");
const { exec } = require("child_process");
const fs = require("fs");
const AdmZip = require("adm-zip");
const { Client } = require("ssh2");

async function drop(argument) {
  try {
    let server = getServer(argument.label);
    if (!server) {
      return vscode.window.showInformationMessage("没有获取到服务器");
    }
    const rootPath = getProjectPath();
    vscode.window.showInformationMessage("构建生产环境代码");
    await runBuild(rootPath);
    vscode.window.showInformationMessage("打包生产环境代码");
    await createZip(rootPath);
    vscode.window.showInformationMessage("投递生产环境代码");
    await dropFile(rootPath, server);
    vscode.window.showInformationMessage("执行成功");
  } catch (error) {
    console.log(error);
    vscode.window.showInformationMessage("执行失败");
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
function runBuild(rootPath) {
  return new Promise((resolve, reject) => {
    // 执行npm install命令
    exec(
      "npm run build",
      {
        cwd: rootPath,
      },
      (error, stdout, stderr) => {
        if (error) {
          console.error(`执行的错误: ${error}`);
          return reject(error);
        }
        console.log(`stdout: ${stdout}`);
        if (stderr) {
          console.log(`stderr: ${stderr}`);
        }
        resolve();
      }
    );
  });
}
function createZip(rootPath) {
  // 文件夹路径
  const folderPath = `${rootPath}/dist`;
  // ZIP文件名
  const zipFileName = `${rootPath}/dist/dist.zip`;
  // 创建AdmZip对象
  const zip = new AdmZip();
  if (fs.existsSync(zipFileName)) {
    // 文件存在
    fs.unlinkSync(zipFileName);
  }
  zip.addLocalFolder(folderPath);
  // get everything as a buffer
  // var willSendthis = zip.toBuffer();
  // or write everything to disk
  zip.writeZip(zipFileName);
}
function dropFile(rootPath, server) {
  return new Promise(async (resolve, reject) => {
    try {
      const conn = await getSSHConnect(server);
      await uploadFile(rootPath, conn, server);
      await extractFile(conn, server);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}
function getServer(label) {
  const config = vscode.workspace.getConfiguration("VueDrop").get("server");
  return config.find((item) => item.name == label);
}
function getSSHConnect(config) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn
      .connect({
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
      })
      .on("ready", () => {
        console.log("Client :: ready");
        resolve(conn);
      })
      .on("error", (error) => {
        reject(error);
        vscode.window.showInformationMessage("连接失败");
      });
  });
}
function uploadFile(rootPath, conn) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) throw err;
      sftp.fastPut(`${rootPath}/dist/dist.zip`, "/opt/dist.zip", {}, (err) => {
        if (err) {
          vscode.window.showInformationMessage("文件上传失败");
          return reject(err);
        }
        sftp.end();
        console.log("Uploaded file successfully");
        resolve();
      });
    });
  });
}
function extractFile(conn, config) {
  return new Promise((resolve) => {
    conn.exec(
      `rm ${config.path} -rf && unzip /opt/dist.zip -d ${config.path}`,
      (err, stream) => {
        if (err) throw err;
        stream
          .on("close", (code, signal) => {
            console.log(
              "Stream :: close :: code: " + code + ", signal: " + signal
            );
            conn.end();
            resolve();
          })
          .on("data", (data) => {
            console.log("STDOUT: " + data);
          })
          .stderr.on("data", (data) => {
            console.log("STDERR: " + data);
          });
      }
    );
  });
}
module.exports = drop;
