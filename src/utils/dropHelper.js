const vscode = require("vscode");
const axios = require("axios");
const fs = require("fs");
const { Client } = require("ssh2");
const FormData = require("form-data");
const { clean } = require("./cleanHelper");

/**
 * 建立ssh连接
 * @param {*} server 服务器配置
 * @returns
 */
function getSSHConnect(server, token) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    token.onCancellationRequested(() => {
      conn.destroy();
      reject("用户取消操作");
    });
    conn
      .connect({
        host: server.host,
        port: server.port,
        username: server.username,
        password: server.password,
      })
      .on("ready", () => {
        console.log("SSH Client Ready");
        resolve(conn);
      })
      .on("error", (error) => {
        console.log("SSH Client Error", error);
        reject("服务器连接失败");
      })
      .on("close", () => {
        console.log("SSH Client Close");
      });
  });
}
/**
 * 上传文件
 * @param {*} rootPath 项目根目录
 * @param {*} buildFloder 打包路径
 * @param {*} conn 连接实例
 * @param {*} server 服务器配置
 * @returns
 */
function uploadFile(rootPath, buildFloder, conn, server, progress, token) {
  return new Promise((resolve, reject) => {
    token.onCancellationRequested(() => {
      conn.destroy();
      reject("用户取消操作");
    });
    // 随机文件名
    let group = /([^/\\]+)[/\\]?$/.exec(server.path);
    let fileName = `dist${group ? "_" + group[1] : ""}.tar.gz`;
    let localFile = `${rootPath}/${buildFloder}/dist.tar.gz`;
    let remoteFile = `/var/tmp/${fileName}`;
    if (server.path.indexOf(":") >= 0) {
      remoteFile = `C:\\Windows\\Temp\\${fileName}`;
    }
    let lastTime = Date.now();
    let lastIncrement = 0;
    conn.sftp((err, sftp) => {
      if (err) throw err;
      sftp.fastPut(
        localFile,
        remoteFile,
        {
          step: (totalTransferredBytes, chunk, totalBytes) => {
            const currentTime = Date.now();
            const elapsedTime = currentTime - lastTime;
            if (elapsedTime > 200) {
              let increment =
                !isNaN(totalBytes) && totalBytes !== 0
                  ? Math.round((totalTransferredBytes / totalBytes) * 100)
                  : 0;
              progress.report({
                message: `${increment}%`,
                increment: increment - lastIncrement,
              });
              lastTime = currentTime;
              lastIncrement = increment;
              console.log(`Progress: ${increment}%`);
            }
          },
        },
        (err) => {
          if (err) {
            console.log(err);
            return reject("文件上传失败");
          }
          sftp.end();
          console.log("Uploaded file successfully");
          resolve(remoteFile);
        }
      );
    });
  });
}
/**
 * 解压文件
 * @param {*} conn 连接实例
 * @param {*} server 服务器配置
 * @param {*} remoteFile 远程压缩包路径
 * @returns
 */
async function extractFile(conn, server, remoteFile, token) {
  return new Promise((resolve, reject) => {
    let system = server.path.indexOf(":") >= 0 ? "windows" : "linux";
    // linux
    let cmd = `rm ${server.path} -rf && mkdir -p ${server.path} && tar -xzvf ${remoteFile} -C ${server.path}`;
    if (system === "windows") {
      // windows 支持开源的bsdtar
      cmd = `(if exist ${server.path} (rd /s /q ${server.path})) && md ${server.path} && (where bsdtar >nul 2>nul && (bsdtar -xzvf ${remoteFile} -C ${server.path}) || (tar -xzvf ${remoteFile} -C ${server.path}))`;
    }
    console.log("执行指令", cmd);
    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      token.onCancellationRequested(() => {
        conn.destroy();
        reject("用户取消操作");
      });
      // 设置伪终端的编码方式为 utf-8
      stream.setEncoding("utf-8");
      stream
        .on("close", (code, signal) => {
          console.log(
            "Stream :: close :: code: " + code + ", signal: " + signal
          );
          conn.end();
          if (code == 0) {
            resolve();
          } else {
            reject();
          }
        })
        .on("data", (data) => {
          console.log("STDOUT: " + data);
        })
        .stderr.on("data", (data) => {
          console.error("STDEER: " + data);
        });
    });
  });
}
/**
 * 空投
 * @param {*} rootPath 项目根目录
 * @param {*} buildFloder 打包路径
 * @param {*} server 服务器配置
 * @returns
 */
function dropFile(rootPath, buildFloder, server) {
  return new Promise(async (resolve, reject) => {
    try {
      // 连接服务器
      const conn = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "连接服务器",
          cancellable: true,
        },
        async (progress, token) => {
          progress.report({ increment: 0 });
          const conn = await getSSHConnect(server, token);
          progress.report({ increment: 100 });
          return token.isCancellationRequested
            ? Promise.reject("用户取消操作")
            : Promise.resolve(conn);
        }
      );
      // 上传
      let remoteFile = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "上传代码",
          cancellable: true,
        },
        (progress, token) => {
          progress.report({ increment: 0 });
          return uploadFile(
            rootPath,
            buildFloder,
            conn,
            server,
            progress,
            token
          );
        }
      );
      // 部署
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "部署代码",
          cancellable: true,
        },
        async (progress, token) => {
          progress.report({ increment: 0 });
          await extractFile(conn, server, remoteFile, token);
          progress.report({ increment: 100 });
          return token.isCancellationRequested
            ? Promise.reject("用户取消操作")
            : Promise.resolve();
        }
      );
      // 删除缓存
      await clean(rootPath, buildFloder);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}
/**
 * 登录
 * @param {*} server 服务器配置
 * @returns
 */
function login(server, token) {
  return new Promise(async (resolve, reject) => {
    token.onCancellationRequested(() => {
      return reject("用户取消操作");
    });
    axios
      .post(`http://${server.host}:${server.port}/users/login`, {
        username: server.username,
        password: server.password,
      })
      .then((response) => {
        if (response.data.success) {
          console.log("Login Success");
          resolve("Bearer " + response.data.data);
        } else {
          console.log(response.data.message);
          reject("登录服务器失败，" + response.data.message);
        }
      })
      .catch((error) => {
        console.log("Login Error", error);
        reject("登录服务器失败");
      });
  });
}

/**
 * 上传文件
 * @param {*} rootPath 项目根目录
 * @param {*} buildFloder 打包路径
 * @param {*} userToken 用户token
 * @param {*} server 服务器配置
 * @returns
 */
function uploadFileByServer(
  rootPath,
  buildFloder,
  userToken,
  server,
  progress,
  token
) {
  return new Promise((resolve, reject) => {
    token.onCancellationRequested(() => {
      reject("用户取消操作");
    });
    // 随机文件名
    let group = /([^/\\]+)[/\\]?$/.exec(server.path);
    let fileName = `dist${group ? "_" + group[1] : ""}.tar.gz`;
    let localFile = `${rootPath}/${buildFloder}/${fileName}`;
    let remoteFileDir = "/var/tmp";
    let remoteFile = `/var/tmp/${fileName}`;
    if (server.path.indexOf(":") >= 0) {
      remoteFileDir = "C:\\Windows\\Temp";
      remoteFile = `C:\\Windows\\Temp\\${fileName}`;
    }
    fs.renameSync(`${rootPath}/${buildFloder}/dist.tar.gz`, localFile);
    const formData = new FormData();
    formData.append("path", remoteFileDir);
    formData.append("files", fs.createReadStream(localFile));
    axios
      .post(`http://${server.host}:${server.port}/files/uploadFile`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: userToken,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            progress.report({
              message: `${percentCompleted}%`,
              increment: percentCompleted,
            });
            console.log(`Progress: ${percentCompleted}%`);
          }
        },
      })
      .then((response) => {
        if (response.data.success) {
          console.log("Uploaded File Success");
          resolve(remoteFile);
        } else {
          reject(`文件上传失败，${response.data.message}`);
        }
      })
      .catch((error) => {
        console.log("Uploaded File Error", error);
        reject("文件上传失败");
      });
  });
}
/**
 * 解压文件
 * @param {*} userToken 用户token
 * @param {*} server 服务器配置
 * @param {*} remoteFile 远程压缩包路径
 * @returns
 */
async function extractFileByServer(userToken, server, remoteFile, token) {
  return new Promise((resolve, reject) => {
    let system = server.path.indexOf(":") >= 0 ? "windows" : "linux";
    // linux
    let cmd = `rm ${server.path} -rf && mkdir -p ${server.path} && tar -xzvf ${remoteFile} -C ${server.path}`;
    if (system === "windows") {
      // windows 支持开源的bsdtar
      cmd = `(if exist ${server.path} (rd /s /q ${server.path})) && md ${server.path} && (where bsdtar >nul 2>nul && (bsdtar -xzvf ${remoteFile} -C ${server.path}) || (tar -xzvf ${remoteFile} -C ${server.path}))`;
    }
    token.onCancellationRequested(() => {
      return reject("用户取消操作");
    });
    console.log("执行指令", cmd);
    axios
      .post(
        `http://${server.host}:${server.port}/terminal/runShell`,
        {
          shell: cmd,
          interpreter: "cmd",
        },
        {
          headers: {
            Authorization: userToken,
          },
        }
      )
      .then((response) => {
        if (response.data.success) {
          resolve();
        } else {
          console.log(response.data.message);
          reject(response.data.message);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}
/**
 * 通过server空投
 * @param {*} rootPath 项目根目录
 * @param {*} buildFloder 打包路径
 * @param {*} server 服务器配置
 * @returns
 */
function dropFileByServer(rootPath, buildFloder, server) {
  return new Promise(async (resolve, reject) => {
    try {
      // 登录
      const userToken = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "登录服务器",
          cancellable: true,
        },
        async (progress, token) => {
          progress.report({ increment: 0 });
          const userToken = await login(server, token);
          progress.report({ increment: 100 });
          return token.isCancellationRequested
            ? Promise.reject("用户取消操作")
            : Promise.resolve(userToken);
        }
      );
      // 上传
      let remoteFile = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "上传代码",
          cancellable: true,
        },
        (progress, token) => {
          progress.report({ increment: 0 });
          return uploadFileByServer(
            rootPath,
            buildFloder,
            userToken,
            server,
            progress,
            token
          );
        }
      );
      // 部署
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "部署代码",
          cancellable: true,
        },
        async (progress, token) => {
          progress.report({ increment: 0 });
          await extractFileByServer(userToken, server, remoteFile, token);
          progress.report({ increment: 100 });
          return token.isCancellationRequested
            ? Promise.reject("用户取消操作")
            : Promise.resolve();
        }
      );
      // 删除缓存
      await clean(rootPath, buildFloder);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}
module.exports = {
  dropFile,
  dropFileByServer,
};
